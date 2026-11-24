"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

/** Logs out on this device and returns to the landing page (PRD §6.1 AC7). */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: "local" })
  redirect("/")
}
