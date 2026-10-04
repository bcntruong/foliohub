import { portfolioDraftSchema, type PortfolioSummary } from '@foliohub/contracts'
import { Hono } from 'hono'
import { ApiError, STATUS, validationError } from '../http'
import { authMiddleware } from '../middleware/auth'
import { PORTFOLIO_SELECT, readPortfolio, type PortfolioRow } from '../portfolio/read'
import { replacePortfolioContent } from '../portfolio/write'
import type { AppEnvironment } from '../types'

interface SummaryRow {
  id: string
  slug: string
  display_name: string
  headline: string
  visibility: PortfolioSummary['visibility']
  updated_at: number
}

const LEGACY_THEME_KEYS = new Set(['cosmic-cyan', 'solar-orange', 'nebula-violet'])

function legacyThemeKey(themeKey: string) {
  return LEGACY_THEME_KEYS.has(themeKey) ? themeKey : 'cosmic-cyan'
}

async function findOwnedPortfolio(context: Parameters<typeof readOwnedPortfolio>[0], id: string) {
  return context.env.DB.prepare(`${PORTFOLIO_SELECT} WHERE portfolios.id = ? AND portfolios.user_id = ?`)
    .bind(id, context.get('user').id)
    .first<PortfolioRow>()
}

async function readOwnedPortfolio(context: import('hono').Context<AppEnvironment>, id: string) {
  const row = await findOwnedPortfolio(context, id)
  if (!row) throw new ApiError(STATUS.notFound, 'Không tìm thấy portfolio', 'PORTFOLIO_NOT_FOUND')
  return readPortfolio(context.env, row)
}

export const portfolioRoutes = new Hono<AppEnvironment>()
portfolioRoutes.use('*', authMiddleware)

portfolioRoutes.get('/', async (context) => {
  const result = await context.env.DB.prepare(
    `SELECT id, slug, display_name, headline, visibility, updated_at
     FROM portfolios WHERE user_id = ? ORDER BY updated_at DESC`,
  )
    .bind(context.get('user').id)
    .all<SummaryRow>()
  return context.json({
    portfolios: result.results.map((row) => ({
      id: row.id,
      slug: row.slug,
      displayName: row.display_name,
      headline: row.headline,
      visibility: row.visibility,
      updatedAt: row.updated_at,
    })),
  })
})

portfolioRoutes.post('/', async (context) => {
  const parsed = portfolioDraftSchema.safeParse(await context.req.json())
  if (!parsed.success) return context.json(validationError(parsed.error), STATUS.badRequest)

  const id = crypto.randomUUID()
  const now = Date.now()
  try {
    await context.env.DB.prepare(
      `INSERT INTO portfolios
        (id, user_id, slug, display_name, headline, summary, strengths, location, contact_email, phone,
         website_url, visibility, template_key, theme_key, display_theme_key, avatar_position_x,
         avatar_position_y, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        id,
        context.get('user').id,
        parsed.data.slug,
        parsed.data.displayName,
        parsed.data.headline,
        parsed.data.summary,
        parsed.data.strengths,
        parsed.data.location,
        parsed.data.contactEmail,
        parsed.data.phone,
        parsed.data.websiteUrl,
        parsed.data.visibility,
        parsed.data.templateKey,
        legacyThemeKey(parsed.data.themeKey),
        parsed.data.themeKey,
        parsed.data.avatarPositionX,
        parsed.data.avatarPositionY,
        now,
        now,
      )
      .run()
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      throw new ApiError(STATUS.conflict, 'Bạn đã dùng đường dẫn này', 'SLUG_EXISTS')
    }
    throw error
  }
  await replacePortfolioContent(context.env, id, parsed.data)
  return context.json({ portfolio: await readOwnedPortfolio(context, id) }, 201)
})

portfolioRoutes.get('/:id', async (context) =>
  context.json({ portfolio: await readOwnedPortfolio(context, context.req.param('id')) }),
)

portfolioRoutes.put('/:id', async (context) => {
  const id = context.req.param('id')
  if (!(await findOwnedPortfolio(context, id))) {
    throw new ApiError(STATUS.notFound, 'Không tìm thấy portfolio', 'PORTFOLIO_NOT_FOUND')
  }
  const parsed = portfolioDraftSchema.safeParse(await context.req.json())
  if (!parsed.success) return context.json(validationError(parsed.error), STATUS.badRequest)

  try {
    await context.env.DB.prepare(
      `UPDATE portfolios SET slug = ?, display_name = ?, headline = ?, summary = ?, strengths = ?, location = ?,
       contact_email = ?, phone = ?, website_url = ?, visibility = ?, template_key = ?, theme_key = ?,
       display_theme_key = ?, avatar_position_x = ?, avatar_position_y = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
    )
      .bind(
        parsed.data.slug,
        parsed.data.displayName,
        parsed.data.headline,
        parsed.data.summary,
        parsed.data.strengths,
        parsed.data.location,
        parsed.data.contactEmail,
        parsed.data.phone,
        parsed.data.websiteUrl,
        parsed.data.visibility,
        parsed.data.templateKey,
        legacyThemeKey(parsed.data.themeKey),
        parsed.data.themeKey,
        parsed.data.avatarPositionX,
        parsed.data.avatarPositionY,
        Date.now(),
        id,
        context.get('user').id,
      )
      .run()
  } catch (error) {
    if (String(error).includes('UNIQUE')) {
      throw new ApiError(STATUS.conflict, 'Bạn đã dùng đường dẫn này', 'SLUG_EXISTS')
    }
    throw error
  }
  await replacePortfolioContent(context.env, id, parsed.data)
  return context.json({ portfolio: await readOwnedPortfolio(context, id) })
})
