import { z } from "zod"

export function tooLong(label: string, max: number) {
  return `${label} must be at most ${max.toLocaleString("en-US")} characters`
}

type TextOptions = {
  /** Keeps line breaks, normalised to `\n`. */
  multiline?: boolean
  /** Turns every run of whitespace into one space (names). */
  collapseSpaces?: boolean
}

/** Trimmed text where an empty field is stored as null. */
export function optionalText(label: string, max: number, { multiline = false, collapseSpaces = false }: TextOptions = {}) {
  let text = z.string()
  if (multiline) text = text.overwrite((value) => value.replace(/\r\n?/g, "\n"))
  if (collapseSpaces) text = text.overwrite((value) => value.replace(/\s+/g, " "))

  return text
    .trim()
    .max(max, tooLong(label, max))
    .transform((value) => value || null)
}

/** A trimmed, valid email address, or null when the field is empty. */
export function optionalEmail(max: number, { lowercase = false } = {}) {
  let text = z.string().trim()
  if (lowercase) text = text.toLowerCase()

  return text
    .max(max, "Email address is too long")
    .transform((value) => value || null)
    .pipe(z.email("Enter a valid email address").nullable())
}
