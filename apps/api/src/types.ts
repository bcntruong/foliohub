import type { UserSummary } from '@foliohub/contracts'

export interface Bindings {
  DB: D1Database
  MEDIA: R2Bucket
  APP_ORIGIN: string
  ENVIRONMENT: 'local' | 'develop' | 'production'
}

export interface Variables {
  user: UserSummary
  sessionId: string
}

export type AppEnvironment = {
  Bindings: Bindings
  Variables: Variables
}

