import { CheckIcon } from "@phosphor-icons/react/ssr"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { setupSteps, type SetupState } from "@/lib/dashboard/summary"
import { cn } from "@/lib/utils"

/** The welcome state when there are no invoices yet (PRD §6.15 AC7). */
export function SetupChecklist({ state }: { state: SetupState }) {
  const steps = setupSteps(state)
  const done = steps.filter((step) => step.done).length
  // The first unfinished required step gets the primary button.
  const next = steps.find((step) => !step.done && !step.optional) ?? steps.find((step) => !step.done)

  return (
    <Card className="mx-auto w-full max-w-3xl">
      <CardHeader className="gap-2">
        <CardTitle className="text-xl font-semibold">Welcome to Payable</CardTitle>
        <CardDescription>A few quick steps to your first paid invoice.</CardDescription>
      </CardHeader>
      <CardContent className="gap-6">
        <Progress value={done} max={steps.length}>
          <ProgressLabel>Setup progress</ProgressLabel>
          <span className="ml-auto text-sm text-muted-foreground tabular-nums">
            {done} of {steps.length} done
          </span>
        </Progress>
        <ol className="flex flex-col gap-2">
          {steps.map((step, index) => (
            <li
              key={step.key}
              className={cn(
                "flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center",
                step === next && "border-primary/50 bg-primary/5"
              )}
            >
              <div className="flex flex-1 items-start gap-3">
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-medium text-muted-foreground tabular-nums",
                    step.done && "border-primary bg-primary text-primary-foreground"
                  )}
                  aria-hidden
                >
                  {step.done ? <CheckIcon weight="bold" className="size-3.5" /> : index + 1}
                </span>
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="flex flex-wrap items-center gap-2 font-medium">
                    <span className={cn(step.done && "text-muted-foreground line-through decoration-muted-foreground/50")}>
                      {step.title}
                    </span>
                    {step.optional && <Badge variant="outline">Optional</Badge>}
                    <span className="sr-only">{step.done ? "(done)" : "(to do)"}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
              </div>
              {!step.done && (
                <Link
                  href={step.href}
                  className={cn(
                    buttonVariants({ variant: step === next ? "default" : "outline", size: "sm" }),
                    "self-start sm:self-center"
                  )}
                >
                  {step.action}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  )
}
