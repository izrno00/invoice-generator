import type { Metadata } from "next"
import { Suspense } from "react"

import { InvoiceBreadcrumb } from "@/components/invoices/invoice-breadcrumb"
import { InvoiceForm, InvoiceFormSkeleton } from "@/components/invoices/invoice-form"
import { listClientOptions } from "@/lib/dal/clients"
import { getProfile } from "@/lib/dal/profile"
import { defaultDueDate, localToday } from "@/lib/invoices/dates"
import { senderFromProfile } from "@/lib/invoices/snapshot"
import { emptyInvoiceValues } from "@/lib/validation/invoice"

export const metadata: Metadata = { title: "New invoice" }

/** Reads the session and the database, so it renders inside a Suspense boundary. */
async function NewInvoice() {
  const [profile, clients] = await Promise.all([getProfile(), listClientOptions()])
  const sender = senderFromProfile(profile)
  // The form switches to the browser's date if it differs.
  const today = localToday()

  return (
    <InvoiceForm
      status="new"
      invoiceNumber={null}
      initialValues={emptyInvoiceValues({ today, dueDate: defaultDueDate(today), currency: profile.defaultCurrency })}
      sender={sender}
      profileSender={sender}
      clients={clients}
      savedClientName={null}
    />
  )
}

export default function NewInvoicePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 md:px-10 md:py-10">
      <InvoiceBreadcrumb current="New invoice" />
      <h1 className="font-heading text-2xl font-semibold tracking-tight">New invoice</h1>
      <Suspense fallback={<InvoiceFormSkeleton />}>
        <NewInvoice />
      </Suspense>
    </div>
  )
}
