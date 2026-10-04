import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { apiErrorResponse } from './http'
import { authRoutes } from './routes/auth'
import { mediaRoutes } from './routes/media'
import { portfolioRoutes } from './routes/portfolios'
import { publicRoutes } from './routes/public'
import type { AppEnvironment } from './types'

const app = new Hono<AppEnvironment>()

app.use('*', secureHeaders())
app.use('*', async (context, next) =>
  cors({
    origin: context.env.APP_ORIGIN,
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
    credentials: true,
    maxAge: 600,
  })(context, next),
)

app.get('/health', (context) =>
  context.json({ status: 'ok', environment: context.env.ENVIRONMENT }),
)
app.route('/v1/auth', authRoutes)
app.route('/v1/me/portfolios', portfolioRoutes)
app.route('/v1/public/portfolios', publicRoutes)
app.route('/v1/media', mediaRoutes)

app.notFound((context) =>
  context.json({ error: { code: 'NOT_FOUND', message: 'Không tìm thấy API' } }, 404),
)
app.onError((error, context) => apiErrorResponse(context, error))

export default app
