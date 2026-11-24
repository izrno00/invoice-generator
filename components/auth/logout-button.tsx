"use client"

import { SignOutIcon } from "@phosphor-icons/react"
import { useFormStatus } from "react-dom"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { signOut } from "@/app/auth/actions"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? <Spinner /> : <SignOutIcon />}
      Log out
    </Button>
  )
}

/** Logs out and returns to the landing page (PRD §6.1 AC7). */
export function LogoutButton() {
  return (
    <form action={signOut}>
      <SubmitButton />
    </form>
  )
}
