import type { Portfolio, PortfolioDraft } from '@foliohub/contracts'
import type { Bindings } from '../types'

interface PortfolioRow {
  id: string
  username: string
  slug: string
  display_name: string
  headline: string
  summary: string
  strengths: string
  location: string
  contact_email: string
  phone: string
  website_url: string
  visibility: PortfolioDraft['visibility']
  template_key: PortfolioDraft['templateKey']
  theme_key: PortfolioDraft['themeKey']
  avatar_media_id: string | null
  avatar_position_x: number
  avatar_position_y: number
  created_at: number
  updated_at: number
}

interface ItemRow {
  id: string
  kind: 'experience' | 'education' | 'project'
  title: string
  subtitle: string
  description: string
  start_date: string
  end_date: string
  url: string
}

interface LinkRow {
  label: string
  url: string
}

function mapItem(row: ItemRow) {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    url: row.url,
  }
}

export async function readPortfolio(env: Bindings, row: PortfolioRow): Promise<Portfolio> {
  const [itemResult, skillResult, linkResult] = await Promise.all([
    env.DB.prepare(
      `SELECT id, kind, title, subtitle, description, start_date, end_date, url
       FROM portfolio_items WHERE portfolio_id = ? ORDER BY kind, sort_order`,
    )
      .bind(row.id)
      .all<ItemRow>(),
    env.DB.prepare('SELECT name FROM portfolio_skills WHERE portfolio_id = ? ORDER BY sort_order')
      .bind(row.id)
      .all<{ name: string }>(),
    env.DB.prepare('SELECT label, url FROM portfolio_links WHERE portfolio_id = ? ORDER BY sort_order')
      .bind(row.id)
      .all<LinkRow>(),
  ])
  const items = itemResult.results

  return {
    id: row.id,
    username: row.username,
    slug: row.slug,
    displayName: row.display_name,
    headline: row.headline,
    summary: row.summary,
    strengths: row.strengths,
    location: row.location,
    contactEmail: row.contact_email,
    phone: row.phone,
    websiteUrl: row.website_url,
    visibility: row.visibility,
    templateKey: row.template_key,
    themeKey: row.theme_key,
    avatarUrl: row.avatar_media_id ? `/v1/media/${row.avatar_media_id}` : null,
    avatarPositionX: row.avatar_position_x,
    avatarPositionY: row.avatar_position_y,
    skills: skillResult.results.map(({ name }) => name),
    experiences: items.filter(({ kind }) => kind === 'experience').map(mapItem),
    educations: items.filter(({ kind }) => kind === 'education').map(mapItem),
    projects: items.filter(({ kind }) => kind === 'project').map(mapItem),
    links: linkResult.results,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export const PORTFOLIO_SELECT = `
  SELECT portfolios.id, users.username, portfolios.slug, portfolios.display_name,
    portfolios.headline, portfolios.summary, portfolios.strengths, portfolios.location, portfolios.contact_email,
    portfolios.phone, portfolios.website_url, portfolios.visibility, portfolios.template_key,
    COALESCE(portfolios.display_theme_key, portfolios.theme_key) AS theme_key,
    portfolios.avatar_position_x,
    portfolios.avatar_position_y, portfolios.avatar_media_id, portfolios.created_at, portfolios.updated_at
  FROM portfolios JOIN users ON users.id = portfolios.user_id`

export type { PortfolioRow }
