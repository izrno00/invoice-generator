import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { ClientBreadcrumb } from "@/components/clients/client-breadcrumb"
import { ClientForm, ClientFormSkeleton } from "@/components/clients/client-form"
import { Skeleton } from "@/components/ui/skeleton"
import { getClient } from "@/lib/dal/clients"
import { clientToFormValues } from "@/lib/validation/client"

export const metadata: Metadata = { title: "Edit client" }

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function EditClient({ params }: Pick<PageProps<"/clients/[id]/edit">, "params">) {
  const { id } = await params
  const client = await getClient(id)
  if (!client) notFound()

  return (
    <>
      <ClientBreadcrumb
        trail={[{ label: client.displayName, href: `/clients/${client.id}` }]}
        current="Edit"
      />
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Edit client</h1>
        <p className="text-sm text-muted-foreground">Changes don&apos;t affect existing invoices.</p>
      </div>
      <ClientForm key={client.id} clientId={client.id} initialValues={clientToFormValues(client)} />
    </>
  )
}

function EditClientSkeleton() {
  return (
    <>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-40" />
      <ClientFormSkeleton />
    </>
  )
}

export default function EditClientPage({ params }: PageProps<"/clients/[id]/edit">) {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <Suspense fallback={<EditClientSkeleton />}>
        <EditClient params={params} />
      </Suspense>
    </div>
  )
}
