"use client"

import { useRouter } from "next/navigation"
import { useEffect, useLayoutEffect, useState } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

/** The in-app destination of a plain left click on a link, or null. */
function inAppDestination(event: MouseEvent): string | null {
  if (event.defaultPrevented || event.button !== 0) return null
  // Modified clicks open a new tab or window, so nothing gets lost.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return null

  const link = event.target instanceof Element ? event.target.closest("a[href]") : null
  if (!(link instanceof HTMLAnchorElement)) return null
  if (link.hasAttribute("download") || (link.target && link.target !== "_self")) return null

  const url = new URL(link.href)
  // Leaving the site is covered by `beforeunload`.
  if (url.origin !== window.location.origin) return null
  // A link to this same page (or an anchor on it) keeps the form.
  if (url.pathname === window.location.pathname && url.search === window.location.search) return null

  return `${url.pathname}${url.search}${url.hash}`
}

/**
 * "Discard changes?" protection for a form with unsaved input. It covers
 * closing or reloading the tab, clicks on in-app links, and anything the form
 * routes through `confirmDiscard` (Cancel, closing a dialog). Render `dialog`
 * somewhere in the form.
 *
 * The browser's Back button can't be intercepted in the App Router. The form
 * keeps its input then, and shows it again on Forward.
 */
export function useUnsavedChangesGuard(isDirty: boolean, { onDiscard }: { onDiscard?: () => void } = {}) {
  const router = useRouter()
  /** What to do if the user chooses to discard. The dialog is open while set. */
  const [pending, setPending] = useState<{ proceed: () => void } | null>(null)

  useEffect(() => {
    if (!isDirty) return

    function warn(event: BeforeUnloadEvent) {
      event.preventDefault()
    }

    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty])

  useEffect(() => {
    if (!isDirty) return

    function intercept(event: MouseEvent) {
      const href = inAppDestination(event)
      if (!href) return
      // <Link> doesn't navigate once the default is prevented.
      event.preventDefault()
      setPending({ proceed: () => router.push(href) })
    }

    // Capture on `window` runs before React's own click handlers.
    window.addEventListener("click", intercept, true)
    return () => window.removeEventListener("click", intercept, true)
  }, [isDirty, router])

  // Next.js hides pages instead of unmounting them: don't come back to an open dialog.
  useLayoutEffect(() => () => setPending(null), [])

  function confirmDiscard(proceed: () => void) {
    if (isDirty) setPending({ proceed })
    else proceed()
  }

  function discard() {
    setPending(null)
    onDiscard?.()
    pending?.proceed()
  }

  const dialog = (
    <AlertDialog
      open={pending !== null}
      onOpenChange={(open) => {
        if (!open) setPending(null)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Discard changes?</AlertDialogTitle>
          <AlertDialogDescription>
            Your changes haven&apos;t been saved. If you leave now, they&apos;ll be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep editing</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={discard}>
            Discard
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )

  return { confirmDiscard, dialog }
}
