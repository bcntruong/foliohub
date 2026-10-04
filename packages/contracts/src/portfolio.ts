import { z } from 'zod'
import {
  DEFAULT_AVATAR_POSITION,
  DEFAULT_TEMPLATE_KEY,
  DEFAULT_THEME_KEY,
  PORTFOLIO_THEME_KEYS,
  PORTFOLIO_VISIBILITIES,
} from './constants'

const optionalText = (max: number) => z.string().trim().max(max).default('')
const WEBSITE_PROTOCOL_PATTERN = /^https?:\/\//i
const ALLOWED_WEBSITE_PROTOCOLS = new Set(['http:', 'https:'])

export function websiteHref(value: string) {
  return WEBSITE_PROTOCOL_PATTERN.test(value) ? value : `https://${value}`
}

export function isValidWebsite(value: string) {
  if (!value) return true
  try {
    const url = new URL(websiteHref(value))
    return ALLOWED_WEBSITE_PROTOCOLS.has(url.protocol) && url.hostname.includes('.')
  } catch {
    return false
  }
}

export const contactEmailSchema = z.union([
  z.literal(''),
  z.string().trim().email('Email không đúng định dạng'),
])
export const websiteUrlSchema = optionalText(500)
  .refine(isValidWebsite, 'Website không đúng định dạng, ví dụ: example.com')

export const portfolioItemSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  subtitle: optionalText(160),
  description: optionalText(2_000),
  startDate: optionalText(30),
  endDate: optionalText(30),
  url: optionalText(500),
})

const educationItemSchema = portfolioItemSchema.extend({
  title: optionalText(120),
  subtitle: z.string().trim().min(1).max(160),
})

export const portfolioDraftSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug chỉ dùng chữ thường, số và dấu gạch ngang'),
  displayName: z.string().trim().min(1).max(100),
  headline: optionalText(160),
  summary: optionalText(2_000),
  strengths: optionalText(2_000),
  location: optionalText(120),
  contactEmail: contactEmailSchema.default(''),
  phone: optionalText(40),
  websiteUrl: websiteUrlSchema,
  visibility: z.enum(PORTFOLIO_VISIBILITIES).default('private'),
  templateKey: z.literal(DEFAULT_TEMPLATE_KEY).default(DEFAULT_TEMPLATE_KEY),
  themeKey: z.enum(PORTFOLIO_THEME_KEYS).default(DEFAULT_THEME_KEY),
  avatarPositionX: z.number().min(0).max(100).default(DEFAULT_AVATAR_POSITION),
  avatarPositionY: z.number().min(0).max(100).default(DEFAULT_AVATAR_POSITION),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  experiences: z.array(portfolioItemSchema).max(20).default([]),
  educations: z.array(educationItemSchema).max(20).default([]),
  projects: z.array(portfolioItemSchema).max(20).default([]),
  links: z
    .array(z.object({ label: z.string().trim().min(1).max(40), url: z.string().url().max(500) }))
    .max(15)
    .default([]),
})

export type PortfolioDraft = z.infer<typeof portfolioDraftSchema>

export interface Portfolio extends PortfolioDraft {
  id: string
  username: string
  avatarUrl: string | null
  createdAt: number
  updatedAt: number
}

export interface PortfolioSummary {
  id: string
  slug: string
  displayName: string
  headline: string
  visibility: (typeof PORTFOLIO_VISIBILITIES)[number]
  updatedAt: number
}
