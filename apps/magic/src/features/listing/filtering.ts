// The pipeline: everything that narrows the list, in one place and in one order.
//
// ONE ORDER, WRITTEN DOWN, BECAUSE THE COUNTS DEPEND ON IT. The number beside each status tab
// has to be "how many would be left if I pressed this", which means the tab counts are taken
// AFTER every other narrowing and BEFORE the tab itself. Work that out per caller and two
// callers will work it out differently.
//
// It is all pure functions over an array. That is what lets the whole of it be tested without
// a browser, and it is why sorting and paging are here rather than inside the table.

import type { Invoice } from '../../data/schema/invoice'
import { withinRange, type DateRange } from './dateRanges'
import { balanceOf, isCancelled, paymentStateOf, type InvoiceStatus } from '../../lib/payment'

/** A range, in paise, either end optional. NOT an operator and a value: v2 asks for Min and
 * Max, which is two plain fields anybody can fill in, where "= < >" is a widget you have to
 * work out before you can type a number into it. */
export type AmountTest = { min: number | null; max: number | null }

export type Narrowing = {
  range: DateRange
  /** Matched against invoice number and party name. Empty means everything. NO MINIMUM LENGTH:
   * a three-character floor means typing an invoice number of "12" finds nothing. */
  search: string
  party: string | null
  total: AmountTest | null
  pending: AmountTest | null
  /** Compliance filters. They are two answers to one question — does this need a compliance
   * action — so having both on is an OR, not an AND. */
  compliance: ComplianceId[]
}

/** Compliance is not on the invoice header yet. The ids are here, the plumbing is here, and
 * `complianceTest` is the ONE place that will read the field when it lands — see the note on
 * that function before adding a second. */
export type ComplianceId = 'eInvoice' | 'eWayBill'

/** Short, because these live on the screen beside the status tabs rather than inside a menu
 * with room to spell things out — and that row has to survive Windows at 125% zoom. */
export const COMPLIANCE_LABEL: Record<ComplianceId, string> = {
  eInvoice: 'E-Inv Pending',
  eWayBill: 'EWB Pending',
}

/**
 * Whether an invoice is waiting on a compliance action.
 *
 * The fields landed on 20-08 and this is the only thing that changed, exactly as the note
 * here said it would be — both doors, the toolbar checkbox and the filter popover, light up
 * from this one function.
 *
 * WAITING MEANS `pending` AND NOTHING ELSE. Not `notRequired`, which is most invoices and is
 * an answer rather than an absence; not `expired`, which is a bill that was raised and has
 * run out, and is a different problem needing a different action. Both statuses come from the
 * GST portal by way of the backend — no front end can work them out from a total and a date,
 * and guessing would be inventing a claim about somebody's tax compliance.
 */
export function needsCompliance(invoice: Invoice, which: ComplianceId): boolean {
  const status = which === 'eInvoice' ? invoice.eInvoiceStatus : invoice.eWayBillStatus
  return status === 'pending'
}

/** Why an e-invoice or an e-way bill cannot be generated for this invoice, or null when it can.
 *
 * DERIVED, NEVER DECLARED. Both menus used to carry the sentence "Needs e-invoice status on the
 * invoice", which was true the day it was typed, stopped being true the day the fields landed,
 * and went on being shown to people as the reason a working feature was switched off. A reason
 * read from the record in front of it cannot go stale; a sentence can, and quietly.
 *
 * Whether generating actually SUCCEEDS is the portal's business, not ours. This only says when
 * asking would make no sense. */
export function cannotGenerate(invoice: Invoice, which: ComplianceId): string | null {
  if (isCancelled(invoice)) return 'This invoice is cancelled'
  const status = which === 'eInvoice' ? invoice.eInvoiceStatus : invoice.eWayBillStatus
  const name = which === 'eInvoice' ? 'An e-invoice' : 'An e-way bill'
  if (status === 'notRequired') return `${name} is not required for this invoice`
  if (status === 'generated') return `${name} has already been generated`
  if (status === 'expired') return 'The e-way bill has expired — that needs a new one, not this'
  return null
}

function amountMatches(paise: number, test: AmountTest | null): boolean {
  if (test === null) return true
  if (test.min !== null && paise < test.min) return false
  if (test.max !== null && paise > test.max) return false
  return true
}

function searchMatches(invoice: Invoice, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (needle === '') return true
  return (
    invoice.number.toLowerCase().includes(needle) || invoice.partyName.toLowerCase().includes(needle)
  )
}

/** Everything except the status tab. The tab counts read this, which is what makes each count
 * say how many would be left rather than how many there are altogether. */
export function narrow(invoices: Invoice[], narrowing: Narrowing): Invoice[] {
  return invoices.filter((invoice) => {
    if (!withinRange(invoice.date, narrowing.range)) return false
    if (!searchMatches(invoice, narrowing.search)) return false
    if (narrowing.party !== null && invoice.partyName !== narrowing.party) return false
    if (!amountMatches(invoice.totalPaise, narrowing.total)) return false
    if (!amountMatches(balanceOf(invoice), narrowing.pending)) return false
    if (narrowing.compliance.length > 0) {
      if (!narrowing.compliance.some((which) => needsCompliance(invoice, which))) return false
    }
    return true
  })
}

export type Tab = 'all' | InvoiceStatus

export function onTab(invoices: Invoice[], tab: Tab, today: string): Invoice[] {
  if (tab === 'all') return invoices
  return invoices.filter((invoice) => paymentStateOf(invoice, today).status === tab)
}

export type SortId = 'date' | 'number' | 'party' | 'total' | 'pending' | 'dueDate' | 'status'
export type Sort = { by: SortId; direction: 'asc' | 'desc' }

/** What a column sorts on. Text sorts as text, money and dates sort as numbers, and status
 * sorts by how much it wants attention rather than alphabetically — Overdue above Paid is
 * useful, "Cancelled, On Acc, Overdue, Paid, Pending" is a filing cabinet. */
const URGENCY: Record<InvoiceStatus, number> = {
  overdue: 0, onAccount: 1, pending: 2, paid: 3, cancelled: 4,
}

function keyOf(invoice: Invoice, by: SortId, today: string): string | number {
  switch (by) {
    case 'date': return invoice.date
    case 'dueDate': return invoice.dueDate
    case 'number': return invoice.number
    case 'party': return invoice.partyName
    case 'total': return invoice.totalPaise
    case 'pending': return balanceOf(invoice)
    case 'status': return URGENCY[paymentStateOf(invoice, today).status]
  }
}

/** How two pieces of text are put in order.
 *
 * `'a' > 'b'` in JavaScript compares the numbers UTF-16 happens to have assigned to those
 * characters, which is not an alphabet. It puts every capital before every small letter, so
 * "Zaveri" sorts above "acme"; and it puts every Indian script in a block after all of Latin,
 * so a customer list written in Devanagari and Gujarati — which is most of the ones this
 * product will meet — comes out in an order that matches no dictionary anybody has read. The
 * previous code lowercased the party name to paper over the first half of that and left the
 * second.
 *
 * `sensitivity: 'base'` treats capitals and accents as the same letter, which is why the party
 * name no longer needs lowercasing on the way in. `numeric: true` reads a run of digits as a
 * number, so invoice INV-2 comes before INV-10 rather than after it — which is the order a
 * person reading a column of invoice numbers is expecting, and it costs nothing here.
 *
 * One collator, built once. Building one per comparison turns a sort of two thousand rows into
 * a few thousand constructions of a fairly expensive object. */
const inOrder = new Intl.Collator('en-IN', { numeric: true, sensitivity: 'base' })

export function sorted(invoices: Invoice[], sort: Sort, today: string): Invoice[] {
  const direction = sort.direction === 'asc' ? 1 : -1
  return [...invoices].sort((left, right) => {
    const a = keyOf(left, sort.by, today)
    const b = keyOf(right, sort.by, today)
    if (typeof a === 'string' && typeof b === 'string') return inOrder.compare(a, b) * direction
    if (a === b) return 0
    return (a > b ? 1 : -1) * direction
  })
}

/** What group an invoice falls in. Only the two the invoice can actually answer: Party Group
 * and Salesman need a field the header does not carry, and both say so in the menu rather than
 * producing one heading called "undefined" with everything under it. */
export function groupLabel(invoice: Invoice, by: string): string | null {
  if (by === 'party') return invoice.partyName
  if (by === 'date') return invoice.date.split('-').reverse().join('-')
  return null
}

/** Rows in group order, keeping the sort inside each group. The table draws a heading each time
 * the label changes, so ORDER is the whole of grouping — there is no second structure to keep
 * in step with the first, and the keyboard walk, the selection and the totals all still work
 * on one flat list of rows. */
export function grouped(invoices: Invoice[], by: string): Invoice[] {
  if (by === 'none') return invoices
  const order: string[] = []
  const bucket = new Map<string, Invoice[]>()

  for (const invoice of invoices) {
    const label = groupLabel(invoice, by) ?? ''
    if (!bucket.has(label)) {
      bucket.set(label, [])
      order.push(label)
    }
    bucket.get(label)!.push(invoice)
  }

  return order.flatMap((label) => bucket.get(label) ?? [])
}

export function page<Row>(rows: Row[], pageNumber: number, size: number): Row[] {
  return rows.slice((pageNumber - 1) * size, pageNumber * size)
}

export const pageCount = (total: number, size: number) => Math.max(1, Math.ceil(total / size))
