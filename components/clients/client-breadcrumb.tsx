import Link from "next/link"
import { Fragment } from "react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type Crumb = { label: string; href: string }

/** "Clients / … / current page". Clients is always the first step. */
export function ClientBreadcrumb({ trail = [], current }: { trail?: Crumb[]; current: string }) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {[{ label: "Clients", href: "/clients" }, ...trail].map((crumb) => (
          <Fragment key={crumb.href}>
            <BreadcrumbItem className="min-w-0">
              <BreadcrumbLink render={<Link href={crumb.href} />} className="max-w-48 truncate">
                {crumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem className="min-w-0">
          <BreadcrumbPage className="max-w-48 truncate">{current}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
