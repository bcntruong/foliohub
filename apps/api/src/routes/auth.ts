import { loginSchema, registerSchema, verifyRegistrationSchema, type UserSummary } from '@foliohub/contracts'
import { Hono } from 'hono'
import { verifyPassword } from '../auth/crypto'
import { beginRegistration, verifyRegistration } from '../auth/registration'
import { clearSessionCookie, createSession } from '../auth/session'
import { ApiError, STATUS, validationError } from '../http'
import { authMiddleware } from '../middleware/auth'
import type { AppEnvironment } from '../types'

interface UserAuthRow extends UserSummary {
  password_hash: string
  password_salt: string
  password_iterations: number
}

export const authRoutes = new Hono<AppEnvironment>()

authRoutes.post('/register', async (context) => {
  const parsed = registerSchema.safeParse(await context.req.json())
  if (!parsed.success) return context.json(validationError(parsed.error), STATUS.badRequest)

  return context.json(await beginRegistration(context.env, parsed.data), 202)
})

authRoutes.post('/register/verify', async (context) => {
  const parsed = verifyRegistrationSchema.safeParse(await context.req.json())
  if (!parsed.success) return context.json(validationError(parsed.error), STATUS.badRequest)

  const user = await verifyRegistration(context.env, parsed.data)
  return context.json({ token: await createSession(context, user.id), user }, 201)
})

authRoutes.post('/login', async (context) => {
  const parsed = loginSchema.safeParse(await context.req.json())
  if (!parsed.success) return context.json(validationError(parsed.error), STATUS.badRequest)

  const identifier = parsed.data.identifier.toLowerCase()
  const row = await context.env.DB.prepare(
    `SELECT id, email, username, password_hash, password_salt, password_iterations
     FROM users WHERE email = ? OR username = ? LIMIT 1`,
  )
    .bind(identifier, identifier)
    .first<UserAuthRow>()
  const valid = row
    ? await verifyPassword(parsed.data.password, row.password_hash, row.password_salt, row.password_iterations)
    : false
  if (!row || !valid) {
    throw new ApiError(STATUS.unauthorized, 'Email, tên tài khoản hoặc mật khẩu không đúng', 'INVALID_CREDENTIALS')
  }

  const user = { id: row.id, email: row.email, username: row.username }
  return context.json({ token: await createSession(context, row.id), user })
})

authRoutes.use('/me', authMiddleware)
authRoutes.get('/me', (context) => context.json({ user: context.get('user') }))

authRoutes.use('/logout', authMiddleware)
authRoutes.post('/logout', async (context) => {
  await context.env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(context.get('sessionId')).run()
  clearSessionCookie(context)
  return context.body(null, 204)
})
