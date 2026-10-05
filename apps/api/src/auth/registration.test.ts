import type { RegisterInput } from '@foliohub/contracts'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Bindings } from '../types'
import { beginRegistration, OTP_EXPIRES_IN_SECONDS, verifyRegistration } from './registration'

const REGISTRATION: RegisterInput = {
  email: 'An@example.com',
  password: 'password1',
  username: 'an_nguyen',
}

function createEnvironment() {
  const values = new Map<string, string>()
  const statements: string[] = []
  const database = {
    prepare(sql: string) {
      statements.push(sql)
      const statement = {
        bind: () => statement,
        first: async () => null,
        run: async () => ({ success: true }),
      }
      return statement
    },
  }
  const registrationOtp = {
    get: async (key: string, type?: string) => {
      const value = values.get(key) ?? null
      return type === 'json' && value ? JSON.parse(value) : value
    },
    put: async (key: string, value: string) => {
      values.set(key, value)
    },
    delete: async (key: string) => {
      values.delete(key)
    },
  }
  const environment = {
    BREVO_API_KEY: 'test-api-key',
    DB: database as unknown as D1Database,
    OTP_FROM_EMAIL: 'noreply@example.com',
    OTP_FROM_NAME: 'FolioHub',
    REGISTRATION_OTP: registrationOtp as unknown as KVNamespace,
  } satisfies Pick<
    Bindings,
    'BREVO_API_KEY' | 'DB' | 'OTP_FROM_EMAIL' | 'OTP_FROM_NAME' | 'REGISTRATION_OTP'
  >

  return { environment, statements, values }
}

describe('registration OTP', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('does not create a user until the correct OTP is verified', async () => {
    const { environment, statements } = createEnvironment()
    let deliveredOtp = ''
    const challenge = await beginRegistration(environment, REGISTRATION, async (_environment, email, otp) => {
      expect(email).toBe('an@example.com')
      deliveredOtp = otp
    })

    expect(statements.some((sql) => sql.includes('INSERT INTO users'))).toBe(false)

    const user = await verifyRegistration(environment, {
      challengeId: challenge.challengeId,
      otp: deliveredOtp,
    })

    expect(user.email).toBe('an@example.com')
    expect(statements.some((sql) => sql.includes('INSERT INTO users'))).toBe(true)
  })

  it('rejects an expired OTP without creating a user', async () => {
    const { environment, statements } = createEnvironment()
    let deliveredOtp = ''
    const challenge = await beginRegistration(environment, REGISTRATION, async (_environment, _email, otp) => {
      deliveredOtp = otp
    })
    vi.advanceTimersByTime((OTP_EXPIRES_IN_SECONDS + 1) * 1_000)

    await expect(verifyRegistration(environment, {
      challengeId: challenge.challengeId,
      otp: deliveredOtp,
    })).rejects.toMatchObject({ code: 'OTP_EXPIRED' })
    expect(statements.some((sql) => sql.includes('INSERT INTO users'))).toBe(false)
  })

  it('invalidates the challenge after five incorrect attempts', async () => {
    const { environment } = createEnvironment()
    let deliveredOtp = ''
    const challenge = await beginRegistration(environment, REGISTRATION, async (_environment, _email, otp) => {
      deliveredOtp = otp
    })
    const incorrectOtp = deliveredOtp === '000000' ? '000001' : '000000'

    for (let attempt = 1; attempt < 5; attempt += 1) {
      await expect(verifyRegistration(environment, {
        challengeId: challenge.challengeId,
        otp: incorrectOtp,
      })).rejects.toMatchObject({ code: 'OTP_INVALID' })
    }
    await expect(verifyRegistration(environment, {
      challengeId: challenge.challengeId,
      otp: incorrectOtp,
    })).rejects.toMatchObject({ code: 'OTP_ATTEMPTS_EXCEEDED' })
  })
})
