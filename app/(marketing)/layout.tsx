import { MarketingFooter } from "@/components/marketing/footer"
import { MarketingNav } from "@/components/marketing/marketing-nav"

/**
 * Public marketing pages (landing, privacy, terms). The sticky header is a direct child of the
 * body's column, so it stays on top all the way down to the footer.
 */
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <MarketingNav />
      <main className="flex flex-1 flex-col">{children}</main>
      <MarketingFooter />
    </>
  )
}
