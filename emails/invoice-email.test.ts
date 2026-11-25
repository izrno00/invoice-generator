import { render, toPlainText } from "@react-email/render"
import { createElement } from "react"
import { describe, expect, it } from "vitest"

import { InvoiceEmail, type InvoiceEmailProps } from "@/emails/invoice-email"

const props: InvoiceEmailProps = {
  message: "Hi Jane,\nplease pay <b>soon</b> & thanks!",
  invoiceNumber: "2026-001",
  total: "EUR 1,234.56",
  dueDate: "8 Dec 2026",
}

describe("InvoiceEmail", () => {
  it("escapes the message and shows the summary", async () => {
    const html = await render(createElement(InvoiceEmail, props))
    expect(html).toContain("please pay &lt;b&gt;soon&lt;/b&gt; &amp; thanks!")
    expect(html).not.toContain("<b>soon</b>")
    expect(html).toContain("2026-001")
    expect(html).toContain("EUR 1,234.56")
    expect(html).toContain("8 Dec 2026")
    expect(html).not.toContain("Pay invoice")
    expect(toPlainText(html)).toContain("Sent via Invoice Generator")
  })

  it("adds the Pay invoice button when there's a payment link", async () => {
    const html = await render(createElement(InvoiceEmail, { ...props, paymentUrl: "https://example.com/pay/abc" }))
    expect(html).toContain("Pay invoice")
    expect(html).toContain('href="https://example.com/pay/abc"')
  })
})
