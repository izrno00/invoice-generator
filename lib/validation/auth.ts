import { z } from "zod"

/** PRD §6.1 AC1. 72 is the bcrypt limit Supabase enforces. */
export const PASSWORD_MIN_LENGTH = 8
export const PASSWORD_MAX_LENGTH = 72

const email = z
  .string()
  .trim()
  .min(1, "Enter your email address")
  .max(320, "Email address is too long")
  .pipe(z.email("Enter a valid email address"))

const newPassword = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters`)

const passwordsMatch = {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
})
export type LoginValues = z.infer<typeof loginSchema>

export const signUpSchema = z
  .object({
    email,
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, passwordsMatch)
export type SignUpValues = z.infer<typeof signUpSchema>

export const emailOnlySchema = z.object({ email })
export type EmailOnlyValues = z.infer<typeof emailOnlySchema>

export const updatePasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirmPassword, passwordsMatch)
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>
