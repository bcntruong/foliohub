import type { PortfolioDraft } from '@foliohub/contracts'
import type { Bindings } from '../types'

type ItemKind = 'experience' | 'education' | 'project'

function itemStatements(env: Bindings, portfolioId: string, draft: PortfolioDraft) {
  const collections: Array<[ItemKind, PortfolioDraft['experiences']]> = [
    ['experience', draft.experiences],
    ['education', draft.educations],
    ['project', draft.projects],
  ]
  return collections.flatMap(([kind, items]) =>
    items.map((item, index) =>
      env.DB.prepare(
        `INSERT INTO portfolio_items
          (id, portfolio_id, kind, title, subtitle, description, start_date, end_date, url, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        item.id ?? crypto.randomUUID(),
        portfolioId,
        kind,
        item.title,
        item.subtitle,
        item.description,
        item.startDate,
        item.endDate,
        item.url,
        index,
      ),
    ),
  )
}

export async function replacePortfolioContent(env: Bindings, portfolioId: string, draft: PortfolioDraft) {
  const statements = [
    env.DB.prepare('DELETE FROM portfolio_items WHERE portfolio_id = ?').bind(portfolioId),
    env.DB.prepare('DELETE FROM portfolio_skills WHERE portfolio_id = ?').bind(portfolioId),
    env.DB.prepare('DELETE FROM portfolio_links WHERE portfolio_id = ?').bind(portfolioId),
    ...itemStatements(env, portfolioId, draft),
    ...draft.skills.map((skill, index) =>
      env.DB.prepare(
        'INSERT INTO portfolio_skills (portfolio_id, name, sort_order) VALUES (?, ?, ?)',
      ).bind(portfolioId, skill, index),
    ),
    ...draft.links.map((link, index) =>
      env.DB.prepare(
        'INSERT INTO portfolio_links (id, portfolio_id, label, url, sort_order) VALUES (?, ?, ?, ?, ?)',
      ).bind(crypto.randomUUID(), portfolioId, link.label, link.url, index),
    ),
  ]
  await env.DB.batch(statements)
}
