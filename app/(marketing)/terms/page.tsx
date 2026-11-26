import type { Metadata } from "next"

import { LegalPlaceholder } from "@/components/marketing/legal-placeholder"

export const metadata: Metadata = {
  title: "Terms of service",
  // Placeholder only; index it once the real terms are published.
  robots: { index: false },
}

export default function TermsPage() {
  return <LegalPlaceholder title="Terms of service" />
}
