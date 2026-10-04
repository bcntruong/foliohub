import type { UserSummary } from '@foliohub/contracts'

export interface Bindings {
  DB: D1Database
  MEDIA: R2Bucket
  REGISTRATION_OTP: KVNamespace
  APP_ORIGIN: string
  ENVIRONMENT: 'local' | 'develop' | 'production'
  OTP_FROM_EMAIL: string
  SMTP_PASSWORD: string
  SMTP_USERNAME: string
}

export interface Variables {
  user: UserSummary
  sessionId: string
}

export type AppEnvironment = {
  Bindings: Bindings
  Variables: Variables
}
