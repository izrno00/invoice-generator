import { z } from "zod"

import { Constants, type Database } from "@/lib/supabase/database.types"

export type CurrencyCode = Database["public"]["Enums"]["currency_code"]

/** The currencies the DB accepts (enum `currency_code`). */
export const CURRENCIES = Constants.public.Enums.currency_code

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  EUR: "EUR — Euro",
  USD: "USD — US dollar",
  BAM: "BAM — Convertible mark",
  GBP: "GBP — British pound",
}

/** Matches the `char_length` checks on `profiles` (DB.md). */
export const PROFILE_LIMITS = {
  fullName: 200,
  companyName: 200,
  email: 320,
  address: 2000,
  vatId: 100,
  website: 500,
} as const

function tooLong(label: string, max: number) {
  return `${label} must be at most ${max.toLocaleString("en-US")} characters`
}

/** Trimmed text where an empty field is stored as null. */
function optionalText(label: string, max: number, { multiline = false } = {}) {
  const text = multiline ? z.string().overwrite((value) => value.replace(/\r\n?/g, "\n")) : z.string()
  return text
    .trim()
    .max(max, tooLong(label, max))
    .transform((value) => value || null)
}

const optionalEmail = z
  .string()
  .trim()
  .max(PROFILE_LIMITS.email, "Email address is too long")
  .transform((value) => value || null)
  .pipe(z.email("Enter a valid email address").nullable())

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:\/\//i

/**
 * Adds `https://` to a bare domain ("example.com") and checks that the result
 * is a usable http(s) address with a real-looking host. Returns null if not.
 * The value is kept as typed (no trailing slash added by `URL.href`).
 */
export function normalizeWebsite(value: string): string | null {
  if (/\s/.test(value)) return null

  const withScheme = HAS_SCHEME.test(value) ? value : `https://${value}`

  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null
  if (url.username || url.password) return null

  const labels = url.hostname.split(".")
  if (labels.length < 2 || labels.some((label) => !label)) return null

  const tld = labels[labels.length - 1]
  if (!/^[a-z]{2,}$/i.test(tld) && !/^xn--[a-z\d-]+$/i.test(tld)) return null

  return withScheme
}

const optionalWebsite = z
  .string()
  .trim()
  .transform((value, ctx) => {
    if (!value) return null

    const website = normalizeWebsite(value)
    if (!website) {
      ctx.addIssue({ code: "custom", message: "Enter a valid website, like example.com" })
      return z.NEVER
    }
    if (website.length > PROFILE_LIMITS.website) {
      ctx.addIssue({ code: "custom", message: tooLong("Website", PROFILE_LIMITS.website) })
      return z.NEVER
    }
    return website
  })

/**
 * Profile settings (PRD §6.2). Takes the form's strings and returns
 * DB-ready values: trimmed, empty → null, website with a scheme.
 * Used by the form resolver and again by the Server Action.
 */
export const profileSchema = z.object({
  fullName: optionalText("Full name", PROFILE_LIMITS.fullName),
  companyName: optionalText("Company name", PROFILE_LIMITS.companyName),
  email: optionalEmail,
  address: optionalText("Address", PROFILE_LIMITS.address, { multiline: true }),
  vatId: optionalText("VAT ID", PROFILE_LIMITS.vatId),
  website: optionalWebsite,
  defaultCurrency: z.enum(CURRENCIES, { error: "Choose a currency" }),
})

/** What the form holds: plain strings. */
export type ProfileFormValues = z.input<typeof profileSchema>
/** What gets stored: empty fields are null. */
export type Profile = z.output<typeof profileSchema>

export function profileToFormValues(profile: Profile): ProfileFormValues {
  return {
    fullName: profile.fullName ?? "",
    companyName: profile.companyName ?? "",
    email: profile.email ?? "",
    address: profile.address ?? "",
    vatId: profile.vatId ?? "",
    website: profile.website ?? "",
    defaultCurrency: profile.defaultCurrency,
  }
}

/**
 * Whether invoices can be sent: a name (full or company) and an email
 * (PRD §6.2 AC5, §7). The dashboard banner and Send both use it.
 */
export function isSenderComplete(profile: Pick<Profile, "fullName" | "companyName" | "email">): boolean {
  return Boolean((profile.fullName || profile.companyName) && profile.email)
}
