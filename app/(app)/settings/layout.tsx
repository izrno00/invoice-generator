import { Suspense } from "react"

import { SettingsNav, SettingsNavLinks } from "@/components/settings/settings-nav"

export default function SettingsLayout({ children }: LayoutProps<"/settings">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <h1 className="font-heading text-2xl font-semibold tracking-tight">Settings</h1>
      <Suspense fallback={<SettingsNavLinks />}>
        <SettingsNav />
      </Suspense>
      {children}
    </div>
  )
}
