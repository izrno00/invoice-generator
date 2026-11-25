import { LockSimpleIcon } from "@phosphor-icons/react/ssr"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Suspense } from "react"

import { InvoiceBreadcrumb } from "@/components/invoices/invoice-breadcrumb"
import { InvoiceForm, InvoiceFormSkeleton } from "@/components/invoices/invoice-form"
import { buttonVariants } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { listClientOptions } from "@/lib/dal/clients"
import { getInvoice } from "@/lib/dal/invoices"
import { getProfile } from "@/lib/dal/profile"
import { senderFromProfile } from "@/lib/invoices/snapshot"

export const metadata: Metadata = { title: "Edit invoice" }

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function EditInvoice({ params, searchParams }: PageProps<"/invoices/[id]/edit">) {
  const { id } = await params
  const [invoice, profile, clients, query] = await Promise.all([
    getInvoice(id),
    getProfile(),
    listClientOptions(),
    searchParams,
  ])
  if (!invoice) notFound()

  const trail = [{ label: invoice.invoiceNumber, href: `/invoices/${invoice.id}` }]

  // PRD §6.5.5: the edit URL of a paid invoice explains instead of showing the form.
  if (invoice.status === "paid") {
    return (
      <>
        <InvoiceBreadcrumb trail={trail} current="Edit" />
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LockSimpleIcon />
            </EmptyMedia>
            <EmptyTitle>Paid invoices can&apos;t be edited</EmptyTitle>
            <EmptyDescription>Invoice {invoice.invoiceNumber} is paid, so it&apos;s locked.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Link href={`/invoices/${invoice.id}`} className={buttonVariants()}>
              View invoice
            </Link>
          </EmptyContent>
        </Empty>
      </>
    )
  }

  return (
    <>
      <InvoiceBreadcrumb trail={trail} current="Edit" />
      <h1 className="font-heading text-2xl font-semibold tracking-tight tabular-nums">
        Edit invoice {invoice.invoiceNumber}
      </h1>
      <InvoiceForm
        key={invoice.id}
        invoiceId={invoice.id}
        status={invoice.status}
        invoiceNumber={invoice.invoiceNumber}
        initialValues={invoice.formValues}
        sender={invoice.document.sender}
        profileSender={senderFromProfile(profile)}
        clients={clients}
        savedClientName={invoice.savedClientName}
        finalize={query.finalize === "1" && invoice.status === "draft"}
      />
    </>
  )
}

function EditInvoiceSkeleton() {
  return (
    <>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-56" />
      <InvoiceFormSkeleton />
    </>
  )
}

export default function EditInvoicePage(props: PageProps<"/invoices/[id]/edit">) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <Suspense fallback={<EditInvoiceSkeleton />}>
        <EditInvoice {...props} />
      </Suspense>
    </div>
  )
}
