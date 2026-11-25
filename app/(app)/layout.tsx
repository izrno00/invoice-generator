import { AppHeader } from "@/components/app-shell/app-header"

/** App shell for logged-in pages. No session read here: it's inside the header's Suspense. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex flex-1 flex-col lg:px-[100px]">{children}</main>
    </div>
  )
}
