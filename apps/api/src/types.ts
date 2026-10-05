import type { UserSummary } from '@foliohub/contracts'

export interface Bindings {
  DB: D1Database
  MEDIA: R2Bucket
  REGISTRATION_OTP: KVNamespace
  APP_ORIGIN: string
  BREVO_API_KEY: string
  ENVIRONMENT: 'local' | 'develop' | 'production'
  OTP_FROM_EMAIL: string
  OTP_FROM_NAME: string
}

export interface Variables {
  user: UserSummary
  sessionId: string
}

export type AppEnvironment = {
  Bindings: Bindings
  Variables: Variables
}
