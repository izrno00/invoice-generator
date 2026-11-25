export type NavItem = { title: string; href: string }

/** Main navigation (PRD §11.2), text only. */
export const NAV_ITEMS: readonly NavItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Invoices", href: "/invoices" },
  { title: "Clients", href: "/clients" },
  { title: "Settings", href: "/settings" },
]

/** `/settings` is active on `/settings/profile` too. */
export function isActivePath(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}
