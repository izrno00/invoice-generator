/**
 * Sender and client details copied onto an invoice (PRD §4 "Snapshot"), so
 * later profile or client edits don't change existing invoices.
 */

import type { Database } from "@/lib/supabase/database.types"
import type { Client } from "@/lib/validation/client"
import type { Profile } from "@/lib/validation/profile"

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"]

export type SenderSnapshot = {
  fullName: string | null
  companyName: string | null
  email: string | null
  address: string | null
  vatId: string | null
  website: string | null
}

export type ClientSnapshot = {
  fullName: string | null
  companyName: string | null
  email: string | null
  address: string | null
  vatId: string | null
}

export const EMPTY_CLIENT_SNAPSHOT: ClientSnapshot = {
  fullName: null,
  companyName: null,
  email: null,
  address: null,
  vatId: null,
}

export function senderFromProfile(profile: Profile): SenderSnapshot {
  return {
    fullName: profile.fullName,
    companyName: profile.companyName,
    email: profile.email,
    address: profile.address,
    vatId: profile.vatId,
    website: profile.website,
  }
}

export function clientFromRecord(client: Client): ClientSnapshot {
  return {
    fullName: client.fullName,
    companyName: client.companyName,
    email: client.email,
    address: client.address,
    vatId: client.vatId,
  }
}

/** Company → Full name → Email, like `clients.display_name`. Null when none is set. */
export function snapshotDisplayName(client: ClientSnapshot): string | null {
  return client.companyName?.trim() || client.fullName?.trim() || client.email?.trim() || null
}

export function hasClientDetails(client: ClientSnapshot): boolean {
  return Object.values(client).some((value) => value !== null && value.trim() !== "")
}

export function senderColumns(sender: SenderSnapshot) {
  return {
    sender_full_name: sender.fullName,
    sender_company_name: sender.companyName,
    sender_email: sender.email,
    sender_address: sender.address,
    sender_vat_id: sender.vatId,
    sender_website: sender.website,
  }
}

export function clientColumns(client: ClientSnapshot) {
  return {
    client_full_name: client.fullName,
    client_company_name: client.companyName,
    client_email: client.email,
    client_address: client.address,
    client_vat_id: client.vatId,
    client_display_name: snapshotDisplayName(client),
  }
}

export function senderFromRow(row: Pick<InvoiceRow, Extract<keyof InvoiceRow, `sender_${string}`>>): SenderSnapshot {
  return {
    fullName: row.sender_full_name,
    companyName: row.sender_company_name,
    email: row.sender_email,
    address: row.sender_address,
    vatId: row.sender_vat_id,
    website: row.sender_website,
  }
}

export function clientFromRow(row: Pick<InvoiceRow, Extract<keyof InvoiceRow, `client_${string}`>>): ClientSnapshot {
  return {
    fullName: row.client_full_name,
    companyName: row.client_company_name,
    email: row.client_email,
    address: row.client_address,
    vatId: row.client_vat_id,
  }
}
