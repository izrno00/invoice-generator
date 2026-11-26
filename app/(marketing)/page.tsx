import { MarketingFaq } from "@/components/marketing/faq"
import { MarketingFeatures } from "@/components/marketing/features"
import { MarketingHero } from "@/components/marketing/hero"
import { MarketingPricing } from "@/components/marketing/pricing"
import { MarketingProduct } from "@/components/marketing/product"
import { WhyPayable } from "@/components/marketing/why-payable"

/** Marketing landing page (PRD §6.16), built section by section. Header and footer come from the layout. */
export default function LandingPage() {
  return (
    <>
      <MarketingHero />
      <WhyPayable />
      <MarketingProduct />
      <MarketingFeatures />
      <MarketingPricing />
      <MarketingFaq />
    </>
  )
}
