"use client"

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon, WarningCircleIcon } from "@phosphor-icons/react"
import { useId } from "react"
import {
  Controller,
  useFieldArray,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
  type UseFormSetValue,
} from "react-hook-form"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { calculateInvoice, calculateLine, type LineInput } from "@/lib/invoices/calc"
import { formatAmount, formatMoney, formatVatRate } from "@/lib/invoices/format"
import { parseMoneyInput, parseQuantityInput, parseVatInput } from "@/lib/invoices/money"
import { cn } from "@/lib/utils"
import { INVOICE_LIMITS, newLine, type InvoiceFormValues, type LineFormValues } from "@/lib/validation/invoice"

const UNIT_LABELS = { hours: "Hours", flat: "Flat" } as const

/** What a line adds up to while it's being typed: anything not (yet) valid counts as 0. */
function liveLine(line: Partial<LineFormValues> | undefined): LineInput {
  const unit = line?.unit === "flat" ? "flat" : "hours"
  return {
    unit,
    quantity: unit === "flat" ? 1 : (parseQuantityInput(line?.quantity ?? "") ?? 0),
    unitPriceCents: parseMoneyInput(line?.price ?? "") ?? 0,
    vatRateBp: parseVatInput(line?.vatRate?.trim() || "0") ?? 0,
  }
}

/** Desktop: one grid row per line under column headers. Phones: each line is a stacked card. */
const ROW_GRID = "md:grid-cols-[minmax(0,1fr)_7rem_5rem_7rem_5.5rem_7rem_6.5rem]"

type EditorProps = {
  control: Control<InvoiceFormValues>
  register: UseFormRegister<InvoiceFormValues>
  setValue: UseFormSetValue<InvoiceFormValues>
  errors: FieldErrors<InvoiceFormValues>
  disabled?: boolean
}

/** Line items with live amounts (PRD §6.5.1): add, remove, move up / down. */
export function LineItemsEditor({ control, register, setValue, errors, disabled = false }: EditorProps) {
  const id = useId()
  const { fields, append, remove, move } = useFieldArray({ control, name: "lines" })
  const lines = useWatch({ control, name: "lines" })
  const full = fields.length >= INVOICE_LIMITS.lines
  const listError = errors.lines?.root?.message ?? errors.lines?.message

  return (
    <div className="flex flex-col gap-4">
      {fields.length > 0 && (
        <div
          aria-hidden
          className={cn(
            "hidden gap-3 border-b pb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase md:grid",
            ROW_GRID
          )}
        >
          <span>Description</span>
          <span>Unit</span>
          <span className="text-right">Qty</span>
          <span className="text-right">Price</span>
          <span className="text-right">VAT %</span>
          <span className="text-right">Amount</span>
          <span />
        </div>
      )}

      <ol className="flex flex-col gap-3">
        {fields.map((field, index) => {
          const line = lines?.[index]
          const flat = line?.unit === "flat"
          const lineErrors = errors.lines?.[index]
          const fieldId = (name: string) => `${id}-${field.id}-${name}`
          const errorId = (name: string) => `${fieldId(name)}-error`
          const amount = calculateLine(liveLine(line)).netCents
          const number = index + 1

          return (
            <li
              key={field.id}
              aria-label={`Line ${number}`}
              className={cn(
                "grid grid-cols-2 gap-3 rounded-lg border p-3 md:items-start md:rounded-none md:border-0 md:p-0",
                ROW_GRID
              )}
            >
              <div className="col-span-2 flex flex-col gap-1.5 md:col-span-1">
                <Label htmlFor={fieldId("description")} className="md:sr-only">
                  Description
                </Label>
                <Input
                  id={fieldId("description")}
                  autoComplete="off"
                  maxLength={INVOICE_LIMITS.description}
                  placeholder="What you did"
                  aria-invalid={!!lineErrors?.description}
                  aria-describedby={lineErrors?.description ? errorId("description") : undefined}
                  disabled={disabled}
                  {...register(`lines.${index}.description`)}
                />
                <FieldError id={errorId("description")} errors={[lineErrors?.description]} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={fieldId("unit")} className="md:sr-only">
                  Unit
                </Label>
                <Controller
                  control={control}
                  name={`lines.${index}.unit`}
                  render={({ field: unit }) => (
                    <Select
                      items={UNIT_LABELS}
                      value={unit.value}
                      disabled={disabled}
                      onValueChange={(value) => {
                        if (!value) return
                        unit.onChange(value)
                        // Flat is always one unit (PRD §6.5.1).
                        if (value === "flat") setValue(`lines.${index}.quantity`, "1", { shouldDirty: true })
                      }}
                    >
                      <SelectTrigger id={fieldId("unit")} ref={unit.ref} onBlur={unit.onBlur} className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="flat">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={fieldId("quantity")} className="md:sr-only">
                  {flat ? "Quantity (always 1 for Flat)" : "Hours"}
                </Label>
                <Input
                  id={fieldId("quantity")}
                  inputMode="numeric"
                  autoComplete="off"
                  className="text-right tabular-nums"
                  readOnly={flat}
                  aria-invalid={!!lineErrors?.quantity}
                  aria-describedby={lineErrors?.quantity ? errorId("quantity") : undefined}
                  disabled={disabled}
                  {...register(`lines.${index}.quantity`)}
                />
                <FieldError id={errorId("quantity")} errors={[lineErrors?.quantity]} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={fieldId("price")} className="md:sr-only">
                  Price
                </Label>
                <Input
                  id={fieldId("price")}
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  className="text-right tabular-nums"
                  aria-invalid={!!lineErrors?.price}
                  aria-describedby={lineErrors?.price ? errorId("price") : undefined}
                  disabled={disabled}
                  {...register(`lines.${index}.price`)}
                />
                <FieldError id={errorId("price")} errors={[lineErrors?.price]} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor={fieldId("vatRate")} className="md:sr-only">
                  VAT %
                </Label>
                <Input
                  id={fieldId("vatRate")}
                  inputMode="decimal"
                  autoComplete="off"
                  className="text-right tabular-nums"
                  aria-invalid={!!lineErrors?.vatRate}
                  aria-describedby={lineErrors?.vatRate ? errorId("vatRate") : undefined}
                  disabled={disabled}
                  {...register(`lines.${index}.vatRate`)}
                />
                <FieldError id={errorId("vatRate")} errors={[lineErrors?.vatRate]} />
              </div>

              <div className="flex flex-col gap-1.5 max-md:col-span-2 max-md:flex-row max-md:items-center max-md:justify-between">
                <span className="text-sm font-medium md:sr-only">Amount</span>
                <output
                  htmlFor={[fieldId("quantity"), fieldId("price")].join(" ")}
                  className="text-right text-sm tabular-nums md:flex md:h-9 md:items-center md:justify-end"
                >
                  {formatAmount(amount)}
                </output>
              </div>

              <div className="col-span-2 flex justify-end gap-1 md:col-span-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Move line ${number} up`}
                  disabled={disabled || index === 0}
                  onClick={() => move(index, index - 1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Move line ${number} down`}
                  disabled={disabled || index === fields.length - 1}
                  onClick={() => move(index, index + 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove line ${number}`}
                  disabled={disabled}
                  onClick={() => remove(index)}
                >
                  <TrashIcon />
                </Button>
              </div>
            </li>
          )
        })}
      </ol>

      {listError && (
        <Alert variant="destructive">
          <WarningCircleIcon />
          <AlertDescription>{listError}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          disabled={disabled || full}
          onClick={() => append(newLine(lines?.at(-1) ?? undefined))}
        >
          <PlusIcon data-icon="inline-start" />
          Add line
        </Button>
        {full && (
          <p className="text-sm text-muted-foreground">
            An invoice can have up to {INVOICE_LIMITS.lines} line items.
          </p>
        )}
      </div>
    </div>
  )
}

/** Subtotal, VAT per rate and Total, updated as the user types (PRD §6.5.1). */
export function InvoiceTotals({ control, currency }: { control: Control<InvoiceFormValues>; currency: string }) {
  const lines = useWatch({ control, name: "lines" })
  const totals = calculateInvoice((lines ?? []).map(liveLine))

  return (
    <dl aria-live="polite" className="ml-auto flex w-full max-w-xs flex-col gap-1 text-sm">
      <div className="flex justify-between gap-4">
        <dt className="text-muted-foreground">Subtotal</dt>
        <dd className="tabular-nums">{formatMoney(totals.subtotalCents, currency)}</dd>
      </div>
      {totals.vatBreakdown.map((row) => (
        <div key={row.rateBp} className="flex justify-between gap-4">
          <dt className="text-muted-foreground">VAT {formatVatRate(row.rateBp)}</dt>
          <dd className="tabular-nums">{formatMoney(row.vatCents, currency)}</dd>
        </div>
      ))}
      <div className="mt-1 flex justify-between gap-4 border-t border-foreground pt-2 text-base font-semibold">
        <dt>Total</dt>
        <dd className="tabular-nums">{formatMoney(totals.totalCents, currency)}</dd>
      </div>
    </dl>
  )
}
