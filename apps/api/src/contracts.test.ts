import { portfolioDraftSchema, registerSchema, websiteHref } from '@foliohub/contracts'
import { describe, expect, it } from 'vitest'

describe('public input contracts', () => {
  it('rejects usernames and slugs that are unsafe in URLs', () => {
    expect(registerSchema.safeParse({ email: 'a@example.com', password: 'password1', username: '../admin' }).success).toBe(false)
    expect(portfolioDraftSchema.safeParse({ slug: 'My Portfolio', displayName: 'An' }).success).toBe(false)
  })

  it('adds safe defaults to a minimal portfolio', () => {
    const result = portfolioDraftSchema.parse({ slug: 'product-designer', displayName: 'Minh An' })

    expect(result.visibility).toBe('private')
    expect(result.skills).toEqual([])
    expect(result.experiences).toEqual([])
    expect(result.avatarPositionX).toBe(50)
    expect(result.avatarPositionY).toBe(50)
  })

  it('validates optional contact fields and builds website links', () => {
    const portfolio = { slug: 'product-designer', displayName: 'Minh An' }

    expect(portfolioDraftSchema.safeParse({ ...portfolio, contactEmail: 'sai-email' }).success).toBe(false)
    expect(portfolioDraftSchema.safeParse({ ...portfolio, websiteUrl: 'foliohub' }).success).toBe(false)
    expect(portfolioDraftSchema.safeParse({ ...portfolio, websiteUrl: 'foliohub.vn/profile' }).success).toBe(true)
    expect(websiteHref('foliohub.vn/profile')).toBe('https://foliohub.vn/profile')
    expect(websiteHref('http://foliohub.vn')).toBe('http://foliohub.vn')
  })

  it('validates avatar crop settings and light themes', () => {
    const portfolio = { slug: 'product-designer', displayName: 'Minh An' }

    expect(portfolioDraftSchema.safeParse({ ...portfolio, themeKey: 'paper-blue' }).success).toBe(true)
    expect(portfolioDraftSchema.safeParse({ ...portfolio, themeKey: 'mint-studio' }).success).toBe(true)
    expect(portfolioDraftSchema.safeParse({ ...portfolio, avatarPositionX: -1 }).success).toBe(false)
  })

  it('allows education without an institution but requires a qualification', () => {
    const portfolio = { slug: 'product-designer', displayName: 'Minh An' }

    expect(portfolioDraftSchema.safeParse({
      ...portfolio,
      educations: [{ title: '', subtitle: 'Kỹ thuật phần mềm' }],
    }).success).toBe(true)
    expect(portfolioDraftSchema.safeParse({
      ...portfolio,
      educations: [{ title: '', subtitle: '' }],
    }).success).toBe(false)
  })
})
