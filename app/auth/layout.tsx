import Link from "next/link"

export default function AuthLayout({ children }: LayoutProps<"/auth">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-10 md:px-10">
      <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
        Invoice Generator
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  )
}
