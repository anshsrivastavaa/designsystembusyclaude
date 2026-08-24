// Invoice lines, made to order. Its own file because the sample invoices need it and it must
// not reach back into the adapter that serves them.

import type { Invoice, InvoiceRow } from '../schema/invoice'
import { lineAmount } from '../../lib/money'
import { items } from './items'

/** Lines of any number, built in one go — the cold open the 100ms test measures. */
export function invoiceOf(rowCount: number): Pick<Invoice, 'rows'> {
  const rows: InvoiceRow[] = []
  for (let index = 0; index < rowCount; index += 1) {
    const item = items[index % items.length]!
    const quantity = (index % 9) + 1
    // One line in six carries a discount, so the column has something to show without every
    // line carrying one — which is what a real invoice looks like. It is worked out before the
    // row so the AMOUNT can be net of it: until 24-08 the discount was set here and applied
    // nowhere, so the column showed a reduction that cost nothing.
    const discountPercent = index % 6 === 2 ? 5 : 0
    rows.push({
      id: `row-${index}`,
      itemId: item.id,
      itemName: item.name,
      quantity,
      unit: item.defaultUnit ?? '',
      pricePaise: item.pricePaise,
      amountPaise: lineAmount(quantity, item.pricePaise, discountPercent),
      taxPercent: item.taxPercent,
      taxTreatment: item.taxTreatment,
      cessPercent: item.cessPercent,
      costPaise: item.costPaise,
      discountPercent,
      // ONE LINE IN ELEVEN CARRIES GOODS GIVEN FREE. Every seeded line was zero, so the column
      // the schema argues hardest for — free goods come out of STOCK and not off the AMOUNT,
      // which is why it is a quantity rather than a discount — had never once been drawn with
      // anything in it. Found by the independent audit on 24-08.
      freeQuantity: index % 11 === 4 ? 1 : 0,
    })
  }
  return { rows }
}

/** A body of lines worth roughly `worthPaise` once tax is on them.
 *
 * WHY THE MOCK NEEDS THIS AT ALL. The seeded invoices want a SPREAD of amounts — a listing of
 * sixty invoices all worth the same thing says nothing about how the screen reads. Until 24-08
 * that spread came from hand-setting `totalPaise` on the header while every invoice shared one
 * six-row body, so all sixty-six reported the same taxable value of 3,686.90 against Invoice
 * Amounts from 450 to 42,450, and the eighteen-hundred-row one was out by a factor of ten. The
 * mock is the specification the backend team reads, and `docs/architecture.md` told them it
 * "cannot describe an impossible invoice".
 *
 * ROUGHLY, AND THAT IS THE HONEST WORD. The prices are scaled and the header is then read off
 * the rows, so what an invoice is worth is whatever its lines come to — never a number written
 * beside them. A target lands within a rupee or two; a promise would have been the same lie in
 * a smaller font. */
export function invoiceWorth(worthPaise: number, rowCount: number = 6): Pick<Invoice, 'rows'> {
  const { rows } = invoiceOf(rowCount)
  const asBuilt = rows.reduce(
    (sum, row) => sum + row.amountPaise + Math.round((row.amountPaise * row.taxPercent) / 100),
    0,
  )
  if (asBuilt <= 0) return { rows }
  const scale = worthPaise / asBuilt
  return {
    rows: rows.map((row) => {
      // A PRICE OF AT LEAST ONE PAISA. Scaling a cheap item down far enough rounds it to zero,
      // and a line priced at nothing is not a cheaper line, it is a broken one.
      const pricePaise = Math.max(1, Math.round(row.pricePaise * scale))
      return { ...row, pricePaise, amountPaise: lineAmount(row.quantity, pricePaise, row.discountPercent) }
    }),
  }
}
