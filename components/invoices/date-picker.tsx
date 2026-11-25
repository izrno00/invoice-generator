"use client"

import { CalendarBlankIcon } from "@phosphor-icons/react"
import { useLayoutEffect, useState, type Ref } from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { fromIsoDate, toIsoDate } from "@/lib/invoices/dates"
import { formatDate } from "@/lib/invoices/format"
import { cn } from "@/lib/utils"

/**
 * A date field: a button showing "24 Nov 2026" that opens a calendar. The
 * value is a SQL date string ("2026-11-24"), or "" when empty.
 */
export function DatePicker({
  id,
  value,
  onChange,
  onBlur,
  placeholder = "Pick a date",
  clearable = false,
  ref,
  className,
  ...aria
}: {
  id?: string
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  /** Offers "Clear" (e.g. for filters). */
  clearable?: boolean
  ref?: Ref<HTMLButtonElement>
  className?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
  "aria-label"?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = fromIsoDate(value) ?? undefined

  // Next.js hides pages instead of unmounting them: don't come back to an open popup.
  useLayoutEffect(() => () => setOpen(false), [])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) onBlur?.()
      }}
    >
      <PopoverTrigger
        render={
          <Button
            ref={ref}
            id={id}
            type="button"
            variant="outline"
            className={cn("w-full justify-start font-normal", !selected && "text-muted-foreground", className)}
            {...aria}
          />
        }
      >
        <CalendarBlankIcon data-icon="inline-start" />
        {selected ? formatDate(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          captionLayout="dropdown"
          onSelect={(date) => {
            if (date) onChange(toIsoDate(date))
            setOpen(false)
          }}
        />
        {clearable && selected && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onChange("")
                setOpen(false)
              }}
            >
              Clear
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
