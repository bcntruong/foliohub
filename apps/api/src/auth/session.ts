import type { UserSummary } from '@foliohub/contracts'
import type { Context } from 'hono'
import { getCookie, setCookie } from 'hono/cookie'
import { ApiError, STATUS } from '../http'
import type { AppEnvironment } from '../types'
import { generateToken, hashToken } from './crypto'

const SESSION_COOKIE = 'foliohub_session'
const SESSION_DAYS = 30
const SESSION_SECONDS = SESSION_DAYS * 24 * 60 * 60

interface SessionRow extends UserSummary {
  session_id: string
}

export async function createSession(context: Context<AppEnvironment>, userId: string) {
  const token = generateToken()
  const now = Date.now()
  await context.env.DB.prepare(
    'INSERT INTO sessions (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(crypto.randomUUID(), userId, await hashToken(token), now + SESSION_SECONDS * 1_000, now)
    .run()

  setCookie(context, SESSION_COOKIE, token, {
    httpOnly: true,
    secure: context.env.ENVIRONMENT !== 'local',
    sameSite: 'Lax',
    maxAge: SESSION_SECONDS,
    path: '/',
  })
  return token
}

export function clearSessionCookie(context: Context<AppEnvironment>) {
  setCookie(context, SESSION_COOKIE, '', { httpOnly: true, maxAge: 0, path: '/', sameSite: 'Lax' })
}

function extractToken(context: Context<AppEnvironment>) {
  const authorization = context.req.header('Authorization')
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7)
  return getCookie(context, SESSION_COOKIE)
}

export async function requireSession(context: Context<AppEnvironment>) {
  const token = extractToken(context)
  if (!token) throw new ApiError(STATUS.unauthorized, 'Bạn cần đăng nhập', 'AUTH_REQUIRED')

  const row = await context.env.DB.prepare(
    `SELECT sessions.id AS session_id, users.id, users.email, users.username
     FROM sessions JOIN users ON users.id = sessions.user_id
     WHERE sessions.token_hash = ? AND sessions.expires_at > ?`,
  )
    .bind(await hashToken(token), Date.now())
    .first<SessionRow>()
  if (!row) throw new ApiError(STATUS.unauthorized, 'Phiên đăng nhập đã hết hạn', 'SESSION_EXPIRED')

  return {
    sessionId: row.session_id,
    user: { id: row.id, email: row.email, username: row.username },
  }
}

