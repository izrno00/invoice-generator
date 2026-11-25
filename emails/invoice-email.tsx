import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from "react-email"

/**
 * The email a client receives (PRD §6.7, Tech.md §10.2). Inline styles only,
 * so it looks the same in every mail client. React escapes the user's text.
 */
export type InvoiceEmailProps = {
  /** The user's message, as typed. Line breaks are kept. */
  message: string
  invoiceNumber: string
  /** Formatted, e.g. "EUR 1,234.56". */
  total: string
  /** Formatted, e.g. "8 Dec 2026". */
  dueDate: string
  /** The pay page. Not included until online payments exist (Milestone 7). */
  paymentUrl?: string | null
}

const text = { fontSize: "15px", lineHeight: "24px", color: "#171717", margin: "0" }
const label = { fontSize: "12px", lineHeight: "18px", color: "#6b6b6b", margin: "0" }
const value = { fontSize: "15px", lineHeight: "22px", color: "#171717", margin: "0 0 12px", fontWeight: 600 }

export function InvoiceEmail({ message, invoiceNumber, total, dueDate, paymentUrl }: InvoiceEmailProps) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{`Invoice ${invoiceNumber} for ${total}, due on ${dueDate}`}</Preview>
      <Body style={{ backgroundColor: "#f5f5f5", fontFamily: "Helvetica, Arial, sans-serif", margin: "0", padding: "24px 0" }}>
        <Container style={{ backgroundColor: "#ffffff", borderRadius: "8px", maxWidth: "560px", padding: "32px" }}>
          <Text style={{ ...text, whiteSpace: "pre-line" }}>{message}</Text>

          <Section
            style={{ backgroundColor: "#fafafa", border: "1px solid #e5e5e5", borderRadius: "8px", margin: "24px 0", padding: "20px 20px 8px" }}
          >
            <Text style={label}>Invoice</Text>
            <Text style={value}>{invoiceNumber}</Text>
            <Text style={label}>Total</Text>
            <Text style={value}>{total}</Text>
            <Text style={label}>Due date</Text>
            <Text style={value}>{dueDate}</Text>
          </Section>

          {paymentUrl && (
            <Section style={{ margin: "0 0 24px" }}>
              <Button
                href={paymentUrl}
                style={{
                  backgroundColor: "#171717",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 600,
                  padding: "12px 20px",
                  textDecoration: "none",
                }}
              >
                Pay invoice
              </Button>
            </Section>
          )}

          <Text style={label}>The invoice is attached as a PDF.</Text>
          <Hr style={{ borderColor: "#e5e5e5", margin: "24px 0 16px" }} />
          <Text style={label}>Sent via Payable</Text>
        </Container>
      </Body>
    </Html>
  )
}

export default InvoiceEmail
