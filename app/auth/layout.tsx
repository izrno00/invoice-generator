import Link from "next/link"

import { Logo } from "@/components/brand/logo"

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 md:px-10 lg:px-[100px]">
      <Link href="/" className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <Logo className="h-9" />
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
