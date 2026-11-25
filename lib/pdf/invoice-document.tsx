import path from "node:path"

import { Document, Font, Page, StyleSheet, Text, View, type DocumentProps } from "@react-pdf/renderer"
import type { ReactElement } from "react"

import { partyLines, type InvoiceDocumentData, type PartyLines } from "@/lib/invoices/document"
import { formatAmount, formatDate, formatMoney, formatQuantity, formatVatRate } from "@/lib/invoices/format"

/**
 * The invoice PDF (PRD §6.6): fixed layout, A4, no status, link or branding.
 * Fonts are embedded TTFs with Latin Extended glyphs, so č ć đ š ž render.
 */

const FONT_DIR = path.join(process.cwd(), "lib", "pdf", "fonts")

Font.register({
  family: "Inter",
  fonts: [
    { src: path.join(FONT_DIR, "Inter-Regular.ttf"), fontWeight: 400 },
    { src: path.join(FONT_DIR, "Inter-SemiBold.ttf"), fontWeight: 600 },
    { src: path.join(FONT_DIR, "Inter-Bold.ttf"), fontWeight: 700 },
  ],
})
// Never split words with hyphens.
Font.registerHyphenationCallback((word) => [word])

const MUTED = "#6b6b6b"
const RULE = "#d9d9d9"

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9.5,
    lineHeight: 1.4,
    color: "#171717",
    paddingTop: 48,
    paddingBottom: 64,
    paddingHorizontal: 48,
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, letterSpacing: 1 },
  number: { fontSize: 12, fontWeight: 600 },
  parties: { flexDirection: "row", gap: 32, marginBottom: 24 },
  party: { flex: 1 },
  label: { fontSize: 8, fontWeight: 600, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 },
  strong: { fontWeight: 600 },
  muted: { color: MUTED },
  meta: {
    flexDirection: "row",
    gap: 24,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: RULE,
    marginBottom: 20,
  },
  metaItem: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#171717",
    paddingBottom: 5,
    marginBottom: 2,
    fontSize: 8,
    fontWeight: 600,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  row: { flexDirection: "row", paddingVertical: 6, borderBottomWidth: 1, borderColor: RULE },
  description: { flex: 1, paddingRight: 12 },
  qty: { width: 52, textAlign: "right" },
  price: { width: 80, textAlign: "right" },
  vat: { width: 48, textAlign: "right" },
  amount: { width: 84, textAlign: "right" },
  totals: { alignSelf: "flex-end", width: 240, marginTop: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: "#171717",
    fontSize: 12,
    fontWeight: 700,
  },
  comments: { marginTop: 32 },
  footer: { position: "absolute", bottom: 28, left: 48, right: 48, textAlign: "right", fontSize: 8, color: MUTED },
})

function Party({ label, party }: { label: string; party: PartyLines | null }) {
  return (
    <View style={styles.party}>
      <Text style={styles.label}>{label}</Text>
      {party?.primary && <Text style={styles.strong}>{party.primary}</Text>}
      {party?.secondary && <Text>{party.secondary}</Text>}
      {party?.address && <Text>{party.address}</Text>}
      {party?.vatId && <Text>VAT ID: {party.vatId}</Text>}
      {party?.email && <Text>{party.email}</Text>}
      {party?.website && <Text>{party.website}</Text>}
    </View>
  )
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaItem}>
      <Text style={styles.label}>{label}</Text>
      <Text>{value}</Text>
    </View>
  )
}

/** Returns the <Document> element itself, which is what renderToBuffer expects. */
export function InvoiceDocument({ data }: { data: InvoiceDocumentData }): ReactElement<DocumentProps> {
  return (
    <Document title={`Invoice ${data.invoiceNumber}`} language="en">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.number}>{data.invoiceNumber}</Text>
        </View>

        <View style={styles.parties}>
          <Party label="From" party={partyLines(data.sender)} />
          <Party label="Bill to" party={data.client && partyLines(data.client)} />
        </View>

        <View style={styles.meta} wrap={false}>
          <Meta label="Invoice number" value={data.invoiceNumber} />
          <Meta label="Invoice date" value={formatDate(data.invoiceDate)} />
          <Meta label="Due date" value={formatDate(data.dueDate)} />
          <Meta label="Currency" value={data.currency} />
        </View>

        {/* `fixed` repeats the header on every page the table continues on. */}
        <View style={styles.tableHeader} fixed>
          <Text style={styles.description}>Description</Text>
          <Text style={styles.qty}>Qty</Text>
          <Text style={styles.price}>Price</Text>
          <Text style={styles.vat}>VAT %</Text>
          <Text style={styles.amount}>Amount</Text>
        </View>
        {data.lines.map((line, index) => (
          <View key={index} style={styles.row} wrap={false}>
            <Text style={styles.description}>{line.description}</Text>
            <Text style={styles.qty}>{formatQuantity(line.quantity, line.unit)}</Text>
            <Text style={styles.price}>{formatAmount(line.unitPriceCents)}</Text>
            <Text style={styles.vat}>{formatVatRate(line.vatRateBp)}</Text>
            <Text style={styles.amount}>{formatAmount(line.netCents)}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={styles.muted}>Subtotal</Text>
            <Text>{formatMoney(data.subtotalCents, data.currency)}</Text>
          </View>
          {data.vatBreakdown.map((row) => (
            <View key={row.rateBp} style={styles.totalRow}>
              <Text style={styles.muted}>VAT {formatVatRate(row.rateBp)}</Text>
              <Text>{formatMoney(row.vatCents, data.currency)}</Text>
            </View>
          ))}
          <View style={styles.grandTotal}>
            <Text>Total</Text>
            <Text>{formatMoney(data.totalCents, data.currency)}</Text>
          </View>
        </View>

        {data.comments && (
          <View style={styles.comments}>
            <Text style={styles.label}>Comments</Text>
            <Text>{data.comments}</Text>
          </View>
        )}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => (totalPages > 1 ? `Page ${pageNumber} of ${totalPages}` : "")}
        />
      </Page>
    </Document>
  )
}
