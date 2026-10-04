import type { MiddlewareHandler } from 'hono'
import { requireSession } from '../auth/session'
import type { AppEnvironment } from '../types'

export const authMiddleware: MiddlewareHandler<AppEnvironment> = async (context, next) => {
  const session = await requireSession(context)
  context.set('user', session.user)
  context.set('sessionId', session.sessionId)
  await next()
}
