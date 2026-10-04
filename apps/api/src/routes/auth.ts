import { loginSchema, registerSchema, type UserSummary } from '@foliohub/contracts'
import { Hono } from 'hono'
import { hashPassword, verifyPassword } from '../auth/crypto'
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

  const existing = await context.env.DB.prepare(
    'SELECT id FROM users WHERE email = ? OR username = ? LIMIT 1',
  )
    .bind(parsed.data.email, parsed.data.username)
    .first()
  if (existing) throw new ApiError(STATUS.conflict, 'Email hoặc tên tài khoản đã được sử dụng', 'USER_EXISTS')

  const id = crypto.randomUUID()
  const now = Date.now()
  const password = await hashPassword(parsed.data.password)
  await context.env.DB.prepare(
    `INSERT INTO users
      (id, email, username, password_hash, password_salt, password_iterations, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      parsed.data.email.toLowerCase(),
      parsed.data.username,
      password.hash,
      password.salt,
      password.iterations,
      now,
      now,
    )
    .run()

  const user = { id, email: parsed.data.email.toLowerCase(), username: parsed.data.username }
  return context.json({ token: await createSession(context, id), user }, 201)
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
