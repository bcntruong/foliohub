import type { RegisterInput, UserSummary, VerifyRegistrationInput } from '@foliohub/contracts'
import { ApiError, STATUS } from '../http'
import type { Bindings } from '../types'
import { hashPassword, hashToken } from './crypto'
import { sendRegistrationOtp } from './registration-email'

export const OTP_EXPIRES_IN_SECONDS = 60
const OTP_DIGITS = 6
const OTP_LIMIT = 10 ** OTP_DIGITS
const MAX_OTP_ATTEMPTS = 5
const PENDING_KEY_PREFIX = 'registration:'
const RATE_LIMIT_KEY_PREFIX = 'registration-rate:'

interface PendingRegistration extends UserSummary {
  expiresAt: number
  failedAttempts: number
  otpHash: string
  passwordHash: string
  passwordIterations: number
  passwordSalt: string
}

type RegistrationEnvironment = Pick<
  Bindings,
  'DB' | 'OTP_FROM_EMAIL' | 'REGISTRATION_OTP' | 'SMTP_PASSWORD' | 'SMTP_USERNAME'
>
type OtpSender = typeof sendRegistrationOtp

function pendingKey(challengeId: string) {
  return `${PENDING_KEY_PREFIX}${challengeId}`
}

async function rateLimitKey(email: string) {
  return `${RATE_LIMIT_KEY_PREFIX}${await hashToken(email)}`
}

function generateOtp() {
  const random = crypto.getRandomValues(new Uint32Array(1))[0] ?? 0
  return String(random % OTP_LIMIT).padStart(OTP_DIGITS, '0')
}

async function ensureUserIsAvailable(environment: RegistrationEnvironment, email: string, username: string) {
  const existing = await environment.DB.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
  ).bind(email, username).first()

  if (existing) {
    throw new ApiError(STATUS.conflict, 'Email hoặc tên tài khoản đã được sử dụng', 'USER_EXISTS')
  }
}

export async function beginRegistration(
  environment: RegistrationEnvironment,
  input: RegisterInput,
  sendOtp: OtpSender = sendRegistrationOtp,
) {
  const email = input.email.toLowerCase()
  await ensureUserIsAvailable(environment, email, input.username)

  const cooldownKey = await rateLimitKey(email)
  if (await environment.REGISTRATION_OTP.get(cooldownKey)) {
    throw new ApiError(STATUS.tooManyRequests, 'Vui lòng chờ 1 phút trước khi gửi lại OTP', 'OTP_RATE_LIMITED')
  }

  const challengeId = crypto.randomUUID()
  const otp = generateOtp()
  const password = await hashPassword(input.password)
  const pending: PendingRegistration = {
    id: crypto.randomUUID(),
    email,
    username: input.username,
    expiresAt: Date.now() + OTP_EXPIRES_IN_SECONDS * 1_000,
    failedAttempts: 0,
    otpHash: await hashToken(`${challengeId}:${otp}`),
    passwordHash: password.hash,
    passwordIterations: password.iterations,
    passwordSalt: password.salt,
  }

  await environment.REGISTRATION_OTP.put(pendingKey(challengeId), JSON.stringify(pending), {
    expirationTtl: OTP_EXPIRES_IN_SECONDS,
  })
  await environment.REGISTRATION_OTP.put(cooldownKey, '1', { expirationTtl: OTP_EXPIRES_IN_SECONDS })

  try {
    await sendOtp(environment, email, otp)
  } catch (error) {
    await Promise.all([
      environment.REGISTRATION_OTP.delete(pendingKey(challengeId)),
      environment.REGISTRATION_OTP.delete(cooldownKey),
    ])
    throw error
  }

  return { challengeId, expiresInSeconds: OTP_EXPIRES_IN_SECONDS }
}

async function readPendingRegistration(environment: RegistrationEnvironment, challengeId: string) {
  const key = pendingKey(challengeId)
  const pending = await environment.REGISTRATION_OTP.get<PendingRegistration>(key, 'json')
  if (!pending || pending.expiresAt <= Date.now()) {
    await environment.REGISTRATION_OTP.delete(key)
    throw new ApiError(STATUS.badRequest, 'Mã OTP đã hết hạn hoặc không tồn tại', 'OTP_EXPIRED')
  }
  return pending
}

async function rejectIncorrectOtp(
  environment: RegistrationEnvironment,
  challengeId: string,
  pending: PendingRegistration,
): Promise<never> {
  pending.failedAttempts += 1
  if (pending.failedAttempts >= MAX_OTP_ATTEMPTS) {
    await environment.REGISTRATION_OTP.delete(pendingKey(challengeId))
    throw new ApiError(STATUS.badRequest, 'Bạn đã nhập sai OTP quá số lần cho phép', 'OTP_ATTEMPTS_EXCEEDED')
  }
  await environment.REGISTRATION_OTP.put(pendingKey(challengeId), JSON.stringify(pending), {
    expirationTtl: OTP_EXPIRES_IN_SECONDS,
  })
  throw new ApiError(STATUS.badRequest, 'Mã OTP không đúng', 'OTP_INVALID')
}

export async function verifyRegistration(
  environment: RegistrationEnvironment,
  input: VerifyRegistrationInput,
) {
  const pending = await readPendingRegistration(environment, input.challengeId)
  const otpHash = await hashToken(`${input.challengeId}:${input.otp}`)
  if (otpHash !== pending.otpHash) {
    return rejectIncorrectOtp(environment, input.challengeId, pending)
  }

  await ensureUserIsAvailable(environment, pending.email, pending.username)
  const now = Date.now()
  await environment.DB.prepare(
    `INSERT INTO users
      (id, email, username, password_hash, password_salt, password_iterations, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    pending.id,
    pending.email,
    pending.username,
    pending.passwordHash,
    pending.passwordSalt,
    pending.passwordIterations,
    now,
    now,
  ).run()
  await environment.REGISTRATION_OTP.delete(pendingKey(input.challengeId))

  return { id: pending.id, email: pending.email, username: pending.username }
}
