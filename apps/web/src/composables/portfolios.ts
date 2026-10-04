import type { Portfolio, PortfolioDraft, PortfolioSummary } from '@foliohub/contracts'
import { apiRequest } from './api'

export function emptyPortfolio(displayName = '', slug = ''): PortfolioDraft {
  return {
    slug,
    displayName,
    headline: '',
    summary: '',
    strengths: '',
    location: '',
    contactEmail: '',
    phone: '',
    websiteUrl: '',
    visibility: 'private',
    templateKey: 'editorial',
    themeKey: 'cosmic-cyan',
    avatarPositionX: 50,
    avatarPositionY: 50,
    skills: [],
    experiences: [],
    educations: [],
    projects: [],
    links: [],
  }
}

export const portfolioApi = {
  list: () => apiRequest<{ portfolios: PortfolioSummary[] }>('/v1/me/portfolios'),
  get: (id: string) => apiRequest<{ portfolio: Portfolio }>(`/v1/me/portfolios/${id}`),
  create: (draft: PortfolioDraft) =>
    apiRequest<{ portfolio: Portfolio }>('/v1/me/portfolios', {
      method: 'POST',
      body: JSON.stringify(draft),
    }),
  update: (id: string, draft: PortfolioDraft) =>
    apiRequest<{ portfolio: Portfolio }>(`/v1/me/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(draft),
    }),
  public: (username: string, slug: string) =>
    apiRequest<{ portfolio: Portfolio }>(`/v1/public/portfolios/${username}/${slug}`),
}
