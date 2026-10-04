import { createTransport } from 'nodemailer'
import { ApiError, STATUS } from '../http'
import type { Bindings } from '../types'

const SMTP_HOST = 'smtp.gmail.com'
const SMTP_PORT = 587
const PLACEHOLDER_EMAIL_SUFFIX = '.example>'

type EmailEnvironment = Pick<Bindings, 'OTP_FROM_EMAIL' | 'SMTP_PASSWORD' | 'SMTP_USERNAME'>

function ensureEmailConfiguration(environment: EmailEnvironment) {
  if (
    !environment.OTP_FROM_EMAIL
    || environment.OTP_FROM_EMAIL.endsWith(PLACEHOLDER_EMAIL_SUFFIX)
    || !environment.SMTP_PASSWORD
    || !environment.SMTP_USERNAME
  ) {
    throw new ApiError(
      STATUS.serviceUnavailable,
      'Dịch vụ gửi OTP chưa được cấu hình',
      'OTP_EMAIL_NOT_CONFIGURED',
    )
  }
}

export async function sendRegistrationOtp(
  environment: EmailEnvironment,
  email: string,
  otp: string,
) {
  ensureEmailConfiguration(environment)
  const transporter = createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: {
      user: environment.SMTP_USERNAME,
      pass: environment.SMTP_PASSWORD,
    },
  })

  try {
    await transporter.sendMail({
      from: environment.OTP_FROM_EMAIL,
      to: email,
      subject: 'Mã xác thực đăng ký FolioHub',
      html: `<p>Mã OTP của bạn là:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>Mã có hiệu lực trong 1 phút.</p>`,
    })
  } catch (error) {
    console.error('Gmail SMTP rejected OTP email', { error })
    throw new ApiError(STATUS.badGateway, 'Không thể gửi mã OTP, vui lòng thử lại', 'OTP_EMAIL_FAILED')
  }
}
