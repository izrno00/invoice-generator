import "server-only"

import { cache } from "react"

import { requireUser } from "@/lib/dal/auth"
import { createClient } from "@/lib/supabase/server"
import type { Database } from "@/lib/supabase/database.types"
import type { Profile } from "@/lib/validation/profile"

/** The columns a user can read and edit (column grants on `profiles`). */
const PROFILE_COLUMNS = "full_name, company_name, email, address, vat_id, website, default_currency"

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "full_name" | "company_name" | "email" | "address" | "vat_id" | "website" | "default_currency"
>

function toProfile(row: ProfileRow): Profile {
  return {
    fullName: row.full_name,
    companyName: row.company_name,
    email: row.email,
    address: row.address,
    vatId: row.vat_id,
    website: row.website,
    defaultCurrency: row.default_currency,
  }
}

/** The signed-in user's profile. A trigger creates the row at sign-up. */
export const getProfile = cache(async (): Promise<Profile> => {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", user.id)
    .single()

  if (error) throw new Error(`Couldn't load profile: ${error.message}`)
  return toProfile(data)
})

/** Saves already-validated values (see `profileSchema`). RLS limits it to the user's own row. */
export async function updateProfile(profile: Profile): Promise<Profile> {
  const user = await requireUser()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: profile.fullName,
      company_name: profile.companyName,
      email: profile.email,
      address: profile.address,
      vat_id: profile.vatId,
      website: profile.website,
      default_currency: profile.defaultCurrency,
    })
    .eq("id", user.id)
    .select(PROFILE_COLUMNS)
    .single()

  if (error) throw new Error(`Couldn't save profile: ${error.message}`)
  return toProfile(data)
}
