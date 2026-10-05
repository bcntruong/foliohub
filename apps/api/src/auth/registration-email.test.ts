import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sendRegistrationOtp } from './registration-email'

const VALID_ENVIRONMENT = {
  BREVO_API_KEY: 'test-api-key',
  OTP_FROM_EMAIL: 'noreply@foliohub.test',
  OTP_FROM_NAME: 'FolioHub',
}

describe('registration OTP email', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 201 })))
  })

  afterEach(() => vi.unstubAllGlobals())

  it('rejects missing email configuration before making an API request', async () => {
    await expect(sendRegistrationOtp({
      BREVO_API_KEY: '',
      OTP_FROM_EMAIL: 'noreply@foliohub.example',
      OTP_FROM_NAME: 'FolioHub',
    }, 'an@example.com', '123456')).rejects.toMatchObject({ code: 'OTP_EMAIL_NOT_CONFIGURED' })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('sends the OTP through Brevo with the configured sender', async () => {
    await sendRegistrationOtp(VALID_ENVIRONMENT, 'an@example.com', '123456')

    expect(fetch).toHaveBeenCalledWith('https://api.brevo.com/v3/smtp/email', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'api-key': VALID_ENVIRONMENT.BREVO_API_KEY }),
      body: expect.stringContaining('123456'),
    }))
  })

  it('returns an OTP email error when Brevo rejects the request', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response('invalid API key', { status: 401 }))

    await expect(sendRegistrationOtp(VALID_ENVIRONMENT, 'an@example.com', '123456'))
      .rejects.toMatchObject({ code: 'OTP_EMAIL_FAILED' })
  })
})
