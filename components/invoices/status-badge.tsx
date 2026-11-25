import { Badge } from "@/components/ui/badge"
import { STATUS_LABELS, type InvoiceStatus } from "@/lib/invoices/status"

const VARIANTS = { draft: "outline", unpaid: "secondary", paid: "default" } as const

/** Draft / Not paid / Paid, plus Overdue on a Not paid invoice past its due date (Tech.md §12). */
export function StatusBadge({ status, overdue = false }: { status: InvoiceStatus; overdue?: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <Badge variant={VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>
      {overdue && <Badge variant="destructive">Overdue</Badge>}
    </span>
  )
}
