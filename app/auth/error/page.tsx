import type { Metadata } from "next"
import Link from "next/link"
import { Suspense } from "react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata: Metadata = { title: "Link problem" }

type Message = { title: string; description: string; action: { href: string; label: string } }

const LOGIN = { href: "/auth/login", label: "Go to log in" }

function messageFor(reason: string | undefined, type: string | undefined): Message {
  if (reason === "link_incomplete") {
    return {
      title: "This link is incomplete",
      description: "Open the link straight from the email, or copy the whole address into your browser.",
      action: LOGIN,
    }
  }
  if (type === "recovery") {
    return {
      title: "This reset link is no longer valid",
      description: "Password reset links work once and expire after 1 hour. Request a new one to continue.",
      action: { href: "/auth/forgot-password", label: "Request a new link" },
    }
  }
  return {
    title: "This confirmation link is no longer valid",
    description:
      "Confirmation links work once and expire after 1 hour. If you already confirmed your email, just log in. If not, log in and we'll offer to send a new link.",
    action: LOGIN,
  }
}

async function ErrorMessage({ searchParams }: { searchParams: PageProps<"/auth/error">["searchParams"] }) {
  const { reason, type } = await searchParams
  const message = messageFor(
    typeof reason === "string" ? reason : undefined,
    typeof type === "string" ? type : undefined
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-lg">{message.title}</CardTitle>
        <CardDescription>{message.description}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Link href={message.action.href} className={buttonVariants({ size: "lg", className: "w-full" })}>
          {message.action.label}
        </Link>
      </CardFooter>
    </Card>
  )
}

export default function AuthErrorPage({ searchParams }: PageProps<"/auth/error">) {
  // searchParams is request data, so it streams in behind a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-44 w-full rounded-xl" />}>
      <ErrorMessage searchParams={searchParams} />
    </Suspense>
  )
}
