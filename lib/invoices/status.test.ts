import { describe, expect, it } from "vitest"

import { allowedActions, isOverdue, NO_CLIENT_EMAIL, PROFILE_INCOMPLETE, type ActionContext } from "@/lib/invoices/status"

const ready: ActionContext = {
  status: "unpaid",
  sent: false,
  clientEmail: "client@example.com",
  senderComplete: true,
  draftComplete: true,
}

describe("isOverdue", () => {
  it("only flags Not paid invoices past their due date", () => {
    expect(isOverdue({ status: "unpaid", dueDate: "2026-11-24" }, "2026-11-25")).toBe(true)
    expect(isOverdue({ status: "unpaid", dueDate: "2026-11-25" }, "2026-11-25")).toBe(false)
    expect(isOverdue({ status: "paid", dueDate: "2026-11-01" }, "2026-11-25")).toBe(false)
    expect(isOverdue({ status: "draft", dueDate: "2026-11-01" }, "2026-11-25")).toBe(false)
  })
})

describe("allowedActions (PRD §5.2)", () => {
  it("allows everything but download on a finished draft", () => {
    const actions = allowedActions({ ...ready, status: "draft" })
    expect(actions).toMatchObject({ edit: true, delete: true, downloadPdf: false, duplicate: true, markPaid: false })
    expect(actions.send).toEqual({ kind: "dialog", label: "Send" })
  })

  it("sends an unfinished draft to the edit form", () => {
    expect(allowedActions({ ...ready, status: "draft", draftComplete: false }).send).toEqual({
      kind: "finish",
      label: "Send",
    })
  })

  it("offers Resend and Mark as paid on a sent Not paid invoice", () => {
    const actions = allowedActions({ ...ready, sent: true })
    expect(actions.send).toEqual({ kind: "dialog", label: "Resend" })
    expect(actions.markPaid).toBe(true)
    expect(actions.downloadPdf).toBe(true)
  })

  it("locks a paid invoice", () => {
    expect(allowedActions({ ...ready, status: "paid", sent: true })).toEqual({
      edit: false,
      delete: false,
      send: { kind: "hidden" },
      downloadPdf: true,
      duplicate: true,
      markPaid: false,
    })
  })

  it("explains why Send is disabled", () => {
    expect(allowedActions({ ...ready, clientEmail: null }).send).toMatchObject({
      kind: "disabled",
      reason: NO_CLIENT_EMAIL,
      profileLink: false,
    })
    expect(allowedActions({ ...ready, senderComplete: false }).send).toMatchObject({
      kind: "disabled",
      reason: PROFILE_INCOMPLETE,
      profileLink: true,
    })
  })
})
