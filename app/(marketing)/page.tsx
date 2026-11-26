import { MarketingHero } from "@/components/marketing/hero"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { WhyPayable } from "@/components/marketing/why-payable"

/** Marketing landing page (PRD §6.16), built section by section. */
export default function LandingPage() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Sticky header: a direct child of the page's column, so it stays on top for every section. */}
      <MarketingNav />
      <MarketingHero />
      <WhyPayable />
    </main>
  )
}
