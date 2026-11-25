import type { Metadata } from "next"

import { ClientBreadcrumb } from "@/components/clients/client-breadcrumb"
import { ClientForm } from "@/components/clients/client-form"
import { EMPTY_CLIENT_VALUES } from "@/lib/validation/client"

export const metadata: Metadata = { title: "New client" }

export default function NewClientPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <ClientBreadcrumb current="New client" />
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">New client</h1>
        <p className="text-sm text-muted-foreground">Fill in at least one field.</p>
      </div>
      <ClientForm initialValues={EMPTY_CLIENT_VALUES} />
    </div>
  )
}
