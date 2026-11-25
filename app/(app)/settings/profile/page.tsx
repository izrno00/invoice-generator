import type { Metadata } from "next"
import { Suspense } from "react"

import { ProfileForm, ProfileFormSkeleton } from "@/components/settings/profile-form"
import { getProfile } from "@/lib/dal/profile"
import { profileToFormValues } from "@/lib/validation/profile"

export const metadata: Metadata = { title: "Profile" }

/** Reads the session, so it renders inside a Suspense boundary. */
async function ProfileSection() {
  const profile = await getProfile()
  return <ProfileForm initialValues={profileToFormValues(profile)} />
}

export default function ProfilePage() {
  return (
    <section aria-labelledby="profile-heading" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="profile-heading" className="font-heading text-lg font-semibold tracking-tight">
          Profile
        </h2>
        <p className="text-sm text-muted-foreground">Your details appear in the From section of new invoices.</p>
      </div>
      <Suspense fallback={<ProfileFormSkeleton />}>
        <ProfileSection />
      </Suspense>
    </section>
  )
}
