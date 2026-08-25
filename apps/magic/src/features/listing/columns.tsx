// Every column the listing can show, in the product document's own order, grouped by what kind
// of thing each is about.
//
// RECEIVABLE, SINGULAR, AND IT IS ONE COLUMN. One invoice has one receivable amount.
// "Receivables" plural is what a business has — a party's whole outstanding across every bill —
// which is a different figure needing a field the invoice does not carry. No second column and
// no second total: the same number under two names is a duplicate.
//
// THE DOCUMENT LISTS SEVEN SHOWN AND EIGHTEEN HIDDEN, AND ONLY THE SEVEN EXISTED. The column
// list therefore looked like the whole set when it was a third of it. The ones the invoice can
// actually answer are here and switchable; the rest are in COLUMNS_WAITING, listed in the setup
// and switched off, each naming the field it needs. A list that silently omits eleven columns
// looks finished, and gets signed off as finished.
//
// GROUPED, because eighteen ticks in one column is a list nobody reads to the end. The groups
// are the questions somebody is actually asking: about the invoice, about the money on it,
// about where it stands with the GST portal, about who it is for.
//
// THREE COLUMNS CANNOT BE TURNED OFF. Date, Invoice No. and Party Name are what makes a row a
// particular invoice. The setup shows them with a padlock, which says it without a sentence.

import { Chip } from '@busy/ui/Chip'
import type { TableColumn } from '@busy/ui/TableColumn'
import { formatPaise } from '../../lib/money'
import type { Invoice } from '../../data/schema/invoice'
import { balanceOf, isCancelled, paymentStateOf, STATUS_LABEL, STATUS_TONE } from '../../lib/payment'

export const LOCKED_COLUMNS = ['date', 'number', 'party']

export const COLUMN_GROUPS = ['The invoice', 'Money', 'Compliance', 'Party'] as const
export type ColumnGroup = (typeof COLUMN_GROUPS)[number]

/** Which group a column belongs in. Beside the columns rather than on them, so the Table
 * primitive never has to know that this screen groups its column list. */
export const GROUP_OF: Record<string, ColumnGroup> = {
  date: 'The invoice', number: 'The invoice', dueDate: 'The invoice', status: 'The invoice',
  total: 'Money', pending: 'Money', received: 'Money', taxable: 'Money', tax: 'Money',
  eInvoice: 'Compliance', eWayBill: 'Compliance',
  party: 'Party',
}

const readable = (day: string) => day.split('-').reverse().join('-')

// WHAT THE ROWS COME TO BEFORE TAX, AND THE TAX ON THEM, ARE READ OFF THE HEADER. This file
// used to add them up here, over invoice.rows, with the reasoning that a stored total is a
// second thing that can disagree with the first. The reasoning was right and pointed the wrong
// way: adding them up here IS the second copy, and it is the one that has to be kept in step by
// hand. They are worked out once where an invoice is built, and a listing reads fields.
//
// It is also not this build's job. The front end shows figures; a rounding rule per row is an
// accounting decision, and when the real backend arrives its answer and ours would differ in
// the last paise on some invoice nobody would think to look at.

const E_INVOICE: Record<string, string> = {
  notRequired: 'Not required', pending: 'Pending', generated: 'Generated', cancelled: 'Cancelled',
}
const E_WAY_BILL: Record<string, string> = {
  notRequired: 'Not required', pending: 'Pending', generated: 'Generated', expired: 'Expired', cancelled: 'Cancelled',
}

/**
 * The invoice number, as the way into the invoice.
 *
 * IT LOOKS LIKE A LINK ONLY WHEN IT IS ONE. `onOpen` is absent wherever the columns are being
 * read rather than rendered — the column-setup list, for one — and a number underlined in
 * accent blue that goes nowhere when pressed is the fault this codebase is named after. So no
 * handler means plain text, and the two cases are one decision written once here rather than a
 * thing every caller has to remember.
 *
 * It is a button and not an `<a>`, deliberately. The shell holds which screen is open and
 * pushes the history entry itself; an anchor with an href would hand the browser a full page
 * load, throwing away the listing's filters, its sort and its page on the way to an invoice
 * somebody means to come straight back from.
 */
function numberCell(row: Invoice, onOpen?: (id: string) => void) {
  if (onOpen === undefined) return row.number
  return (
    <button
      type="button"
      data-role="open-invoice"
      // No stopPropagation. It was here guarding against the click also reaching the row —
      // and a row has no click handler at all, so it was guarding nothing. The test written
      // alongside it passed with the guard removed, which is how it was caught: a check that
      // cannot fail proves nothing, and neither does the code it was defending.
      onClick={() => onOpen(row.id)}
      // UNDERLINED ALWAYS, NOT ON HOVER. It was accent ink with the underline arriving only when
      // pointed at, which makes the most-clicked control on the screen a link identified by
      // COLOUR ALONE — invisible to roughly one man in twelve, and to anybody who never happens
      // to hover. WCAG 1.4.1 is the floor and the industry answer is the same one: a permanent
      // underline. Hover still has somewhere to go, because it thickens rather than appearing.
      className="rounded-control text-ink-accent underline decoration-1 underline-offset-2 hover:decoration-2 focus-ring"
    >
      {row.number}
    </button>
  )
}

// SHORTENED RATHER THAN WRAPPED. The headings are uppercase caps now, and a caps heading that
// reflows at comfortable density moves every row under it. "Invoice Amount" and "Taxable Amount"
// are the two that do not fit their column at the larger size, so the word is shortened — which
// is a thing a LABEL may do and a sentence may not.
export function listingColumns(today: string, onOpen?: (id: string) => void): TableColumn<Invoice>[] {
  return [
    // The first column is semibold: one weight step anchors the eye at the left edge of a wide
    // row, which is the job vertical rules used to do and every measured system ships off.
    { id: 'date', header: 'Date', width: 'w-32', sortable: true, cell: (row) => <span className="font-strong">{readable(row.date)}</span> },
    { id: 'number', header: 'Invoice No.', width: 'w-40', sortable: true, cell: (row) => numberCell(row, onOpen) },
    { id: 'party', header: 'Party Name', sortable: true, cell: (row) => row.partyName },
    { id: 'total', header: 'Invoice Amt', width: 'w-40', align: 'end', sortable: true, cell: (row) => formatPaise(row.totalPaise) },
    {
      id: 'pending', header: 'Receivable', width: 'w-40', align: 'end', sortable: true,
      // An em dash rather than 0.00 when nothing is owed. A column of zeroes reads as money and
      // has to be decoded; a dash reads as "nothing here" at a glance.
      cell: (row) => (balanceOf(row) === 0 ? '—' : formatPaise(balanceOf(row))),
    },
    {
      id: 'dueDate', header: 'Due Date', width: 'w-32', sortable: true,
      cell: (row) => (isCancelled(row) ? '—' : readable(row.dueDate)),
    },
    {
      id: 'status', header: 'Status', width: 'w-36', sortable: true,
      cell: (row) => {
        const { status } = paymentStateOf(row, today)
        return <Chip tone={STATUS_TONE[status]}>{STATUS_LABEL[status]}</Chip>
      },
    },

    // ---- off by default, and every one of them answerable from the invoice ----
    {
      id: 'received', header: 'Received', width: 'w-40', align: 'end', sortable: true,
      cell: (row) => (row.paidPaise === 0 ? '—' : formatPaise(row.paidPaise)),
    },
    { id: 'taxable', header: 'Taxable Amt', width: 'w-40', align: 'end', cell: (row) => formatPaise(row.taxablePaise) },
    { id: 'tax', header: 'Total Tax', width: 'w-36', align: 'end', cell: (row) => formatPaise(row.taxPaise) },
    { id: 'eInvoice', header: 'E-Invoice', width: 'w-36', cell: (row) => E_INVOICE[row.eInvoiceStatus] ?? '—' },
    { id: 'eWayBill', header: 'E-Way Bill', width: 'w-36', cell: (row) => E_WAY_BILL[row.eWayBillStatus] ?? '—' },
  ]
}

/** The columns the document asks for that no field on the invoice can answer yet, and what each
 * waits on. Listed in the setup so the gap is visible to whoever signs this off, rather than
 * discovered by the dev team six weeks later. */
export const COLUMNS_WAITING: { header: string; group: ColumnGroup; needs: string }[] = [
  { header: 'Discount Amount', group: 'Money', needs: 'a discount on the invoice' },
  { header: 'IRN Number', group: 'Compliance', needs: 'the IRN the portal returns' },
  { header: 'E-Way Bill No.', group: 'Compliance', needs: 'the e-way bill number' },
  { header: 'Party GSTIN', group: 'Party', needs: 'the party GSTIN on the invoice' },
  { header: 'Party Phone Number', group: 'Party', needs: 'the party contact on the invoice' },
  { header: 'Party Email', group: 'Party', needs: 'the party contact on the invoice' },
  { header: 'Place of Supply', group: 'Party', needs: 'the party address on the invoice' },
  { header: 'Reference No. / PO No.', group: 'The invoice', needs: 'a reference on the invoice' },
  { header: 'Payment Terms', group: 'The invoice', needs: 'payment terms on the invoice' },
  { header: 'Sales Person / Created By', group: 'The invoice', needs: 'a salesperson on the invoice' },
  { header: 'Warehouse / Godown', group: 'The invoice', needs: 'a warehouse on the invoice' },
  { header: 'Attachment', group: 'The invoice', needs: 'an attachment marker on the invoice' },
]
