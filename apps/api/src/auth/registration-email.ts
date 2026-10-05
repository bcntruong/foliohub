import { ApiError, STATUS } from '../http'
import type { Bindings } from '../types'

const BREVO_EMAIL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email'
const PLACEHOLDER_EMAIL_SUFFIX = '.example'

type EmailEnvironment = Pick<Bindings, 'BREVO_API_KEY' | 'OTP_FROM_EMAIL' | 'OTP_FROM_NAME'>

function ensureEmailConfiguration(environment: EmailEnvironment) {
  if (
    !environment.BREVO_API_KEY
    || !environment.OTP_FROM_EMAIL
    || environment.OTP_FROM_EMAIL.endsWith(PLACEHOLDER_EMAIL_SUFFIX)
    || !environment.OTP_FROM_NAME
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

  const response = await fetch(BREVO_EMAIL_ENDPOINT, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'api-key': environment.BREVO_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      sender: {
        email: environment.OTP_FROM_EMAIL,
        name: environment.OTP_FROM_NAME,
      },
      to: [{ email }],
      subject: 'Mã xác thực đăng ký FolioHub',
      htmlContent: `<p>Mã OTP của bạn là:</p><p style="font-size:28px;font-weight:700;letter-spacing:6px">${otp}</p><p>Mã có hiệu lực trong 1 phút.</p>`,
    }),
  })

  if (!response.ok) {
    console.error('Brevo rejected OTP email', {
      responseBody: await response.text(),
      status: response.status,
    })
    throw new ApiError(STATUS.badGateway, 'Không thể gửi mã OTP, vui lòng thử lại', 'OTP_EMAIL_FAILED')
  }
}
