"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { requireUser } from "@/lib/dal/auth"
import { updateProfile as saveProfile } from "@/lib/dal/profile"
import { profileSchema, profileToFormValues, type ProfileFormValues } from "@/lib/validation/profile"

export type UpdateProfileResult =
  | { ok: true; values: ProfileFormValues }
  | {
      ok: false
      fieldErrors?: Partial<Record<keyof ProfileFormValues, string[]>>
      message?: string
    }

/** Settings → Profile save (PRD §6.2). Validates again on the server. */
export async function updateProfile(values: unknown): Promise<UpdateProfileResult> {
  await requireUser("/settings/profile")

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) {
    return { ok: false, fieldErrors: z.flattenError(parsed.error).fieldErrors }
  }

  let saved
  try {
    saved = await saveProfile(parsed.data)
  } catch (error) {
    console.error(error)
    return { ok: false, message: "Couldn't save your profile. Please try again." }
  }

  revalidatePath("/settings/profile")
  // The dashboard banner depends on the profile.
  revalidatePath("/dashboard")
  return { ok: true, values: profileToFormValues(saved) }
}
