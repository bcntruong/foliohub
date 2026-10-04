import { z } from 'zod'

export const USERNAME_PATTERN = /^[a-z0-9_-]+$/
export const USERNAME_HINT = 'Dùng để đăng nhập và tạo URL portfolio. Nhập 3–30 ký tự gồm chữ thường, số, dấu gạch dưới (_) hoặc gạch ngang (-), không có khoảng trắng.'

const passwordSchema = z
  .string()
  .min(8, 'Mật khẩu cần ít nhất 8 ký tự')
  .max(72, 'Mật khẩu tối đa 72 ký tự')

const emailSchema = z.string().email('Email không hợp lệ').max(254)
const usernameSchema = z
  .string()
  .min(3, 'Tên tài khoản cần ít nhất 3 ký tự')
  .max(30, 'Tên tài khoản tối đa 30 ký tự')
  .regex(USERNAME_PATTERN, USERNAME_HINT)

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  username: usernameSchema,
})

export const loginSchema = z.object({
  identifier: z.union([emailSchema, usernameSchema], {
    error: 'Email hoặc tên tài khoản không hợp lệ',
  }),
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
