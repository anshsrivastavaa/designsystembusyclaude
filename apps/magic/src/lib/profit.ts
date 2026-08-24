// What a line, or a whole invoice, made. Pure, and it knows nothing about who may see it.
//
// PROFIT IS WORKED OUT ON THE GOODS, NOT ON THE PAYABLE. Tax is collected on behalf of the
// government and handed over; counting it as margin makes every invoice look eighteen per cent
// better than it was. Charges are left out for the same reason — freight recovered from a
// customer is a cost passed on, not a thing sold at a mark-up, and mixing it in makes the
// margin on the GOODS unreadable, which is the number a shopkeeper is actually pricing with.

import type { Paise } from './money'

export type SoldLine = {
  itemId: string | null
  amountPaise: Paise
  costPaise: Paise
  quantity: number
  taxPercent: number
  taxTreatment?: 'taxable' | 'nil' | 'exempt' | 'zeroRated'
}

export type Profit = {
  profitPaise: Paise
  /** Of the selling value, what share is profit. Null when nothing was sold — a percentage of
   * nothing is not zero per cent, it is no answer, and showing 0% would be a claim. */
  percent: number | null
}

/** In prices-including-tax mode the amount already holds the tax, so it comes out before the
 * cost is subtracted — otherwise the margin silently includes the government's share. */
function sellingValue(line: SoldLine, taxIsInside: boolean): Paise {
  if (!taxIsInside || (line.taxTreatment ?? 'taxable') !== 'taxable') return line.amountPaise
  return Math.round((line.amountPaise * 100) / (100 + line.taxPercent))
}

export function profitOf(lines: readonly SoldLine[], taxIsInside: boolean): Profit {
  const sold = lines.filter((line) => line.itemId !== null)

  let value = 0
  let cost = 0
  for (const line of sold) {
    value += sellingValue(line, taxIsInside)
    cost += Math.round(line.costPaise * line.quantity)
  }

  const profitPaise = value - cost
  return { profitPaise, percent: value === 0 ? null : (profitPaise / value) * 100 }
}
