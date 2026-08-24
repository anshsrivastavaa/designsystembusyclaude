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
    rows.push({
      id: `row-${index}`,
      itemId: item.id,
      itemName: item.name,
      quantity,
      unit: item.defaultUnit ?? '',
      pricePaise: item.pricePaise,
      amountPaise: lineAmount(quantity, item.pricePaise),
      taxPercent: item.taxPercent,
      taxTreatment: item.taxTreatment,
      cessPercent: item.cessPercent,
      costPaise: item.costPaise,
      // One line in six carries a discount, so the column has something to show without every
      // line carrying one — which is what a real invoice looks like.
      discountPercent: index % 6 === 2 ? 5 : 0,
      freeQuantity: 0,
    })
  }
  return { rows }
}
