"use client"

import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useId } from "react"

import { useUrlSearch } from "@/components/forms/use-url-search"
import { DatePicker } from "@/components/invoices/date-picker"
import {
  hasFilters,
  invoicesListHref,
  parseInvoiceListParams,
  SEARCH_MAX_LENGTH,
  type InvoiceListParams,
} from "@/components/invoices/list-params"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STATUS_FILTER_LABELS, STATUS_FILTERS } from "@/lib/invoices/status"

const ALL = "all"

export type ClientFilterOption = { id: string; label: string }

/** The current list URL's filters, read when needed (a debounced search runs later). */
function currentParams(): InvoiceListParams {
  return parseInvoiceListParams(Object.fromEntries(new URLSearchParams(window.location.search)))
}

/**
 * Status, client, date range and search (PRD §6.11 AC4–6). Everything lives
 * in the URL; any change goes back to page 1.
 */
export function InvoicesFilters({ clients }: { clients: ClientFilterOption[] }) {
  const router = useRouter()
  const id = useId()
  const params = parseInvoiceListParams(Object.fromEntries(useSearchParams()))

  function update(change: Partial<InvoiceListParams>) {
    router.replace(invoicesListHref({ ...currentParams(), ...change, page: 1 }), { scroll: false })
  }

  const {
    inputRef: searchRef,
    defaultValue: searchDefault,
    onChange: onSearchChange,
  } = useUrlSearch((q) => invoicesListHref({ ...currentParams(), q, page: 1 }))

  const statusItems = { [ALL]: "All statuses", ...STATUS_FILTER_LABELS }
  const clientItems: Record<string, string> = { [ALL]: "All clients" }
  for (const client of clients) clientItems[client.id] = client.label
  if (params.client && !clientItems[params.client]) clientItems[params.client] = "Deleted client"

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(4,minmax(0,1fr))]">
        <Field className="sm:col-span-2 lg:col-span-1">
          <FieldLabel htmlFor={`${id}-q`}>Search</FieldLabel>
          <InputGroup>
            <InputGroupAddon>
              <MagnifyingGlassIcon />
            </InputGroupAddon>
            <InputGroupInput
              id={`${id}-q`}
              ref={searchRef}
              type="search"
              placeholder="Invoice number or client"
              autoComplete="off"
              maxLength={SEARCH_MAX_LENGTH}
              defaultValue={searchDefault}
              onChange={onSearchChange}
            />
          </InputGroup>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-status`}>Status</FieldLabel>
          <Select
            items={statusItems}
            value={params.status ?? ALL}
            onValueChange={(value) => update({ status: value === ALL ? null : (value as InvoiceListParams["status"]) })}
          >
            <SelectTrigger id={`${id}-status`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUS_FILTERS.map((status) => (
                <SelectItem key={status} value={status}>
                  {STATUS_FILTER_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-client`}>Client</FieldLabel>
          <Select
            items={clientItems}
            value={params.client ?? ALL}
            onValueChange={(value) => update({ client: value === ALL || !value ? null : value })}
          >
            <SelectTrigger id={`${id}-client`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(clientItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-from`}>From</FieldLabel>
          <DatePicker
            id={`${id}-from`}
            value={params.from ?? ""}
            placeholder="Any date"
            clearable
            onChange={(from) => update({ from: from || null })}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor={`${id}-to`}>To</FieldLabel>
          <DatePicker
            id={`${id}-to`}
            value={params.to ?? ""}
            placeholder="Any date"
            clearable
            onChange={(to) => update({ to: to || null })}
          />
        </Field>
      </div>

      {hasFilters(params) && (
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.replace("/invoices", { scroll: false })}>
            <XIcon data-icon="inline-start" />
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
