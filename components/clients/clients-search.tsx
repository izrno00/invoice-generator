"use client"

import { MagnifyingGlassIcon } from "@phosphor-icons/react"

import { clientsListHref, SEARCH_MAX_LENGTH } from "@/components/clients/list-params"
import { useUrlSearch } from "@/components/forms/use-url-search"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"

/** Search as you type: puts `?q=` in the URL, which goes back to page 1. */
export function ClientsSearch() {
  const { inputRef, defaultValue, onChange } = useUrlSearch((q) => clientsListHref({ q }))

  return (
    <InputGroup className="sm:max-w-sm">
      <InputGroupAddon>
        <MagnifyingGlassIcon />
      </InputGroupAddon>
      <InputGroupInput
        ref={inputRef}
        type="search"
        aria-label="Search clients"
        placeholder="Search by name, company or email"
        autoComplete="off"
        maxLength={SEARCH_MAX_LENGTH}
        defaultValue={defaultValue}
        onChange={onChange}
      />
    </InputGroup>
  )
}
