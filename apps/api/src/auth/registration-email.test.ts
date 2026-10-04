import { createTransport } from 'nodemailer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sendRegistrationOtp } from './registration-email'

vi.mock('nodemailer', () => ({ createTransport: vi.fn() }))

const sendMail = vi.fn()
const VALID_ENVIRONMENT = {
  OTP_FROM_EMAIL: 'FolioHub <noreply@foliohub.test>',
  SMTP_PASSWORD: 'test-app-password',
  SMTP_USERNAME: 'noreply@foliohub.test',
}

describe('registration OTP email', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(createTransport).mockReturnValue({ sendMail } as never)
    sendMail.mockResolvedValue({ messageId: 'test-message' })
  })

  it('rejects missing SMTP configuration before creating a transport', async () => {
    await expect(sendRegistrationOtp({
      OTP_FROM_EMAIL: 'FolioHub <noreply@foliohub.example>',
      SMTP_PASSWORD: '',
      SMTP_USERNAME: 'noreply.foliohub@gmail.com',
    }, 'an@example.com', '123456')).rejects.toMatchObject({ code: 'OTP_EMAIL_NOT_CONFIGURED' })
    expect(createTransport).not.toHaveBeenCalled()
  })

  it('sends the OTP through Gmail SMTP with the configured sender', async () => {
    await sendRegistrationOtp(VALID_ENVIRONMENT, 'an@example.com', '123456')

    expect(createTransport).toHaveBeenCalledWith(expect.objectContaining({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
    }))
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({
      from: VALID_ENVIRONMENT.OTP_FROM_EMAIL,
      to: 'an@example.com',
      html: expect.stringContaining('123456'),
    }))
  })
})
