import { randomBytes } from "node:crypto"

/** The secret part of `/pay/{token}` (DB.md §3.5): 24 random bytes, 32 base64url characters. */
export function newPaymentToken(): string {
  return randomBytes(24).toString("base64url")
}
