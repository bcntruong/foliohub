import { Hono } from 'hono'
import { ApiError, STATUS } from '../http'
import { PORTFOLIO_SELECT, readPortfolio, type PortfolioRow } from '../portfolio/read'
import type { AppEnvironment } from '../types'

export const publicRoutes = new Hono<AppEnvironment>()

publicRoutes.get('/:username/:slug', async (context) => {
  const row = await context.env.DB.prepare(
    `${PORTFOLIO_SELECT}
     WHERE users.username = ? AND portfolios.slug = ? AND portfolios.visibility = 'public'`,
  )
    .bind(context.req.param('username'), context.req.param('slug'))
    .first<PortfolioRow>()
  if (!row) throw new ApiError(STATUS.notFound, 'Không tìm thấy portfolio', 'PORTFOLIO_NOT_FOUND')
  return context.json({ portfolio: await readPortfolio(context.env, row) })
})

