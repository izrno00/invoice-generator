export type NavItem = { title: string; href: string }

/** Main navigation (PRD §11.2), text only. Invoices and Clients join when they ship. */
export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Settings", href: "/settings" },
]

/** `/settings` is active on `/settings/profile` too. */
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
