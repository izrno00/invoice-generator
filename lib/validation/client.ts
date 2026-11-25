import { z } from "zod"

import { optionalEmail, optionalText } from "@/lib/validation/fields"

/** Matches the `char_length` checks on `clients` (DB.md §3.3). */
export const CLIENT_LIMITS = {
  fullName: 200,
  companyName: 200,
  email: 320,
  address: 2000,
  vatId: 100,
} as const

/** Issue path for errors about the whole form rather than one field. */
export const CLIENT_FORM_ERROR = "_form"

export const EMPTY_CLIENT_MESSAGE = "Fill in at least one field"

/**
 * A client (PRD §6.4): every field is optional, but at least one must be
 * filled in. Used by the form resolver and again by the Server Action.
 */
export const clientSchema = z
  .object({
    fullName: optionalText("Full name", CLIENT_LIMITS.fullName, { collapseSpaces: true }),
    companyName: optionalText("Company name", CLIENT_LIMITS.companyName, { collapseSpaces: true }),
    email: optionalEmail(CLIENT_LIMITS.email, { lowercase: true }),
    address: optionalText("Address", CLIENT_LIMITS.address, { multiline: true }),
    vatId: optionalText("VAT ID", CLIENT_LIMITS.vatId),
  })
  .superRefine((client, ctx) => {
    if (Object.values(client).every((value) => value === null)) {
      ctx.addIssue({ code: "custom", path: [CLIENT_FORM_ERROR], message: EMPTY_CLIENT_MESSAGE })
    }
  })

/** What the form holds: plain strings. */
export type ClientFormValues = z.input<typeof clientSchema>
/** What gets stored: empty fields are null. */
export type Client = z.output<typeof clientSchema>

export const EMPTY_CLIENT_VALUES: ClientFormValues = {
  fullName: "",
  companyName: "",
  email: "",
  address: "",
  vatId: "",
}

export function clientToFormValues(client: Client): ClientFormValues {
  return {
    fullName: client.fullName ?? "",
    companyName: client.companyName ?? "",
    email: client.email ?? "",
    address: client.address ?? "",
    vatId: client.vatId ?? "",
  }
}

/** Shown for a client that only has an address or a VAT ID. */
export const UNNAMED_CLIENT = "Unnamed client"

type Identity = Pick<Client, "fullName" | "companyName" | "email">

/** Company → Full name → Email (PRD §6.4), like the `display_name` column. */
export function clientDisplayName({ companyName, fullName, email }: Identity): string {
  return companyName?.trim() || fullName?.trim() || email?.trim() || UNNAMED_CLIENT
}

export type DuplicateMatch = "email" | "company" | "name"

function comparable(value: string | null) {
  return value?.replace(/\s+/g, " ").trim().toLowerCase() || null
}

/** The identifying details two clients share, for the duplicate warning. */
export function matchClientDetails(a: Identity, b: Identity): DuplicateMatch[] {
  const same = (key: keyof Identity) => {
    const value = comparable(a[key])
    return value !== null && value === comparable(b[key])
  }

  const matches: DuplicateMatch[] = []
  if (same("email")) matches.push("email")
  if (same("companyName")) matches.push("company")
  if (same("fullName")) matches.push("name")
  return matches
}
