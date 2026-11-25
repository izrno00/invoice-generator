"use server"

import { revalidatePath } from "next/cache"
import { redirect, RedirectType } from "next/navigation"
import { z } from "zod"

import { requireUser } from "@/lib/dal/auth"
import {
  deleteClient,
  findDuplicateClients,
  getClientDeleteSummary,
  insertClient,
  updateClient,
  type ClientDeleteSummary,
  type ClientOption,
  type DuplicateClient,
} from "@/lib/dal/clients"
import { CLIENT_FORM_ERROR, clientSchema, clientToFormValues, type ClientFormValues } from "@/lib/validation/client"

const SAVE_FAILED = "Couldn't save the client. Please try again."
const DELETE_FAILED = "Couldn't delete the client. Please try again."
const NOT_FOUND = "This client no longer exists."

export type SaveClientResult =
  | { ok: true; client: ClientOption; values: ClientFormValues }
  /** Similar clients exist. Send again with `confirmDuplicates` to save anyway. */
  | { ok: false; duplicates: DuplicateClient[] }
  | {
      ok: false
      duplicates?: undefined
      fieldErrors?: Partial<Record<keyof ClientFormValues | typeof CLIENT_FORM_ERROR, string[]>>
      message?: string
    }

const saveInput = z.object({
  id: z.uuid().optional(),
  values: z.unknown(),
  confirmDuplicates: z.boolean().optional(),
})

/** Creates a client, or updates it when there's an `id` (PRD §6.4 AC3). */
export async function saveClient(input: unknown): Promise<SaveClientResult> {
  await requireUser("/clients")

  const request = saveInput.safeParse(input)
  if (!request.success) return { ok: false, message: SAVE_FAILED }
  const { id, values, confirmDuplicates } = request.data

  const parsed = clientSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors, message: SAVE_FAILED }
  }

  let saved
  try {
    if (!confirmDuplicates) {
      const duplicates = await findDuplicateClients(parsed.data, id)
      if (duplicates.length > 0) return { ok: false, duplicates }
    }
    saved = id ? await updateClient(id, parsed.data) : await insertClient(parsed.data)
  } catch (error) {
    console.error(error)
    return { ok: false, message: SAVE_FAILED }
  }

  if (!saved) return { ok: false, message: NOT_FOUND }

  revalidatePath("/clients")
  revalidatePath(`/clients/${saved.id}`)
  revalidatePath(`/clients/${saved.id}/edit`)
  return { ok: true, client: saved, values: clientToFormValues(parsed.data) }
}

export type DeleteSummaryResult =
  | { ok: true; summary: ClientDeleteSummary }
  | { ok: false; message: string }

/** Loaded when the delete dialog opens. */
export async function getClientDeleteSummaryAction(id: unknown): Promise<DeleteSummaryResult> {
  await requireUser("/clients")

  const parsed = z.uuid().safeParse(id)
  if (!parsed.success) return { ok: false, message: NOT_FOUND }

  try {
    const summary = await getClientDeleteSummary(parsed.data)
    return summary ? { ok: true, summary } : { ok: false, message: NOT_FOUND }
  } catch (error) {
    console.error(error)
    return { ok: false, message: "Couldn't check this client's invoices. Please try again." }
  }
}

export type DeleteClientResult = { ok: true } | { ok: false; message: string }

const deleteInput = z.object({
  id: z.uuid(),
  deleteUnpaid: z.boolean(),
  returnToList: z.boolean(),
})

/**
 * Deletes a client (PRD §6.4 AC6). With `returnToList` (used on the client's
 * own page) it redirects, so that page never re-renders as "not found".
 */
export async function deleteClientAction(input: unknown): Promise<DeleteClientResult> {
  await requireUser("/clients")

  const parsed = deleteInput.safeParse(input)
  if (!parsed.success) return { ok: false, message: DELETE_FAILED }
  const { id, deleteUnpaid, returnToList } = parsed.data

  let deleted
  try {
    deleted = await deleteClient(id, deleteUnpaid)
  } catch (error) {
    console.error(error)
    return { ok: false, message: DELETE_FAILED }
  }

  revalidatePath("/clients")
  revalidatePath("/invoices")
  revalidatePath("/dashboard")

  if (!deleted) return { ok: false, message: NOT_FOUND }
  // The list shows the "Client deleted" toast (see ClientDeletedNotice).
  if (returnToList) redirect(`/clients?deleted=${id}`, RedirectType.replace)
  return { ok: true }
}
