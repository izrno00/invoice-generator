import { UserIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import { getProfile } from "@/lib/dal/profile"
import { isSenderComplete } from "@/lib/validation/profile"

/** Nudges users to fill in what Send needs (PRD §6.2 AC5, §6.15 AC5). */
export async function ProfileBanner() {
  const profile = await getProfile()
  if (isSenderComplete(profile)) return null

  return (
    <Alert>
      <UserIcon />
      <AlertTitle>Complete your profile to send invoices</AlertTitle>
      <AlertDescription>Add your name or company name and an email address.</AlertDescription>
      <div className="col-start-2 mt-2">
        <Link href="/settings/profile" className={buttonVariants({ size: "sm" })}>
          Complete profile
        </Link>
      </div>
    </Alert>
  )
}
