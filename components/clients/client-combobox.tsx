"use client"

import { Combobox as ComboboxPrimitive } from "@base-ui/react"
import { PlusIcon } from "@phosphor-icons/react"
import { useLayoutEffect, useState, type ComponentProps } from "react"

import { AddClientDialog } from "@/components/clients/add-client-dialog"
import {
  Combobox,
  ComboboxContent,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox"
import type { ClientOption } from "@/lib/dal/clients"

/** The list entry that opens the dialog instead of selecting anything. */
const ADD_CLIENT: ClientOption = {
  id: "add-client",
  displayName: "Add new client",
  fullName: null,
  companyName: null,
  email: null,
}

function matches(client: ClientOption, query: string) {
  const term = query.trim().toLocaleLowerCase()
  return [client.displayName, client.fullName, client.companyName, client.email].some((value) =>
    value?.toLocaleLowerCase().includes(term)
  )
}

function NoClientsMessage({ hasClients }: { hasClients: boolean }) {
  // Only the "Add new client" entry is left when nothing matches.
  const shown = ComboboxPrimitive.useFilteredItems<ClientOption>()
  if (shown.length > 1) return null

  return (
    <p role="status" className="px-3 pt-2 pb-1 text-sm text-muted-foreground">
      {hasClients ? "No matching clients" : "No clients yet"}
    </p>
  )
}

/**
 * Searchable client picker with "+ Add new client" (PRD §6.4 AC4, §9). Pass
 * `options` from `listClientOptions()`. For the invoice form.
 */
export function ClientCombobox({
  options,
  extraOptions = [],
  value,
  onValueChange,
  placeholder = "Select a client",
  ...inputProps
}: {
  options: ClientOption[]
  /** Entries listed before the clients, e.g. a deleted client's details saved on an invoice. */
  extraOptions?: ClientOption[]
  /** The selected client's id. */
  value: string | null
  onValueChange: (clientId: string | null) => void
  placeholder?: string
} & Pick<ComponentProps<typeof ComboboxInput>, "id" | "disabled" | "aria-invalid" | "aria-describedby" | "aria-label">) {
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  // Selectable straight away, before the refreshed `options` arrive.
  const [created, setCreated] = useState<ClientOption[]>([])

  // Next.js hides pages instead of unmounting them: don't come back to an open popup.
  useLayoutEffect(
    () => () => {
      setOpen(false)
      setAdding(false)
    },
    []
  )

  const clients = [
    ...extraOptions,
    ...options,
    ...created.filter((client) => !options.some((option) => option.id === client.id)),
  ]
  const selected = clients.find((client) => client.id === value) ?? null

  return (
    <>
      <Combobox
        items={[...clients, ADD_CLIENT]}
        value={selected}
        open={open}
        onOpenChange={setOpen}
        onValueChange={(client, details) => {
          if (client?.id === ADD_CLIENT.id) {
            details.cancel()
            setOpen(false)
            setAdding(true)
            return
          }
          onValueChange(client?.id ?? null)
        }}
        itemToStringLabel={(client: ClientOption) => client.displayName}
        isItemEqualToValue={(a: ClientOption, b: ClientOption) => a.id === b.id}
        filter={(client: ClientOption, query: string) => client.id === ADD_CLIENT.id || matches(client, query)}
      >
        <ComboboxInput {...inputProps} placeholder={placeholder} showClear={selected !== null} className="w-full" />
        <ComboboxContent>
          <NoClientsMessage hasClients={clients.length > 0} />
          <ComboboxList>
            {(client: ClientOption) => (
              <ComboboxItem key={client.id} value={client}>
                {client.id === ADD_CLIENT.id ? (
                  <>
                    <PlusIcon />
                    {client.displayName}
                  </>
                ) : (
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{client.displayName}</span>
                    {client.email && client.email !== client.displayName && (
                      <span className="truncate text-xs text-muted-foreground">{client.email}</span>
                    )}
                  </span>
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>

      <AddClientDialog
        open={adding}
        onOpenChange={setAdding}
        onCreated={(client) => {
          setCreated((previous) => [...previous, client])
          onValueChange(client.id)
        }}
      />
    </>
  )
}
