import { z } from 'zod'

const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')

export const registerSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(254),
  password: passwordSchema,
  username: z
    .string()
    .min(3, 'Username cần ít nhất 3 ký tự')
    .max(30)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Chỉ dùng chữ thường, số và dấu gạch ngang'),
})

export const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ').max(254),
  password: passwordSchema,
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>

export interface UserSummary {
  id: string
  email: string
  username: string
}

export interface AuthResponse {
  token: string
  user: UserSummary
}

