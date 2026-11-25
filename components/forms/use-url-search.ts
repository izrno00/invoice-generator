"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"

const DEBOUNCE_MS = 300

/**
 * Search as you type for an uncontrolled input: after a pause, `hrefFor(q)`
 * replaces the URL (lists keep `?q=` there, so it survives a reload). Typing
 * ahead of the URL is kept; a `q` changed elsewhere ("Clear", Back) is shown.
 */
export function useUrlSearch(hrefFor: (q: string) => string) {
  const router = useRouter()
  const urlQuery = useSearchParams().get("q") ?? ""

  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  /** Searches this input sent that haven't shown up in the URL yet. */
  const sent = useRef<string[]>([])

  useEffect(() => {
    const index = sent.current.indexOf(urlQuery)
    if (index >= 0) {
      // Our own change arriving. The input may already be ahead of it.
      sent.current.splice(0, index + 1)
      return
    }
    // Changed elsewhere ("Clear search", a nav link, Back): show it.
    clearTimeout(timer.current)
    sent.current = []
    if (inputRef.current && inputRef.current.value.trim() !== urlQuery) {
      inputRef.current.value = urlQuery
    }
  }, [urlQuery])

  // A search still waiting must not pull the user back after they leave.
  useEffect(() => () => clearTimeout(timer.current), [])

  function search(value: string) {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      const q = value.trim()
      if (q === (sent.current.at(-1) ?? urlQuery)) return
      sent.current.push(q)
      router.replace(hrefFor(q), { scroll: false })
    }, DEBOUNCE_MS)
  }

  return {
    inputRef,
    defaultValue: urlQuery,
    onChange: (event: { target: { value: string } }) => search(event.target.value),
  }
}
