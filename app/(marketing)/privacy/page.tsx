import type { Metadata } from "next"

import { LegalPlaceholder } from "@/components/marketing/legal-placeholder"

export const metadata: Metadata = {
  title: "Privacy policy",
  // Placeholder only; index it once the real policy is published.
  robots: { index: false },
}

export default function PrivacyPage() {
  return <LegalPlaceholder title="Privacy policy" />
}
