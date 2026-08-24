// What a bill sundry comes to. Pure, because this is where an invoice quietly goes wrong.
//
// WHAT A PERCENTAGE IS A PERCENTAGE OF, and it is not the same answer for every row:
//
//   an ordinary charge — a percentage of the GOODS
//   a tax row          — a percentage of the goods PLUS every charge that is itself taxable
//
// The second one matters. Freight billed by the supplier is part of the taxable value under
// GST, so tax worked out on the goods alone under-charges tax on every invoice that carries
// freight — quietly, correctly-looking, and on every invoice.
//
// Order: the rows calculate in the order the master puts them in, and the user cannot move
// them. Tax rows are worked out after all of them, whatever position they sit in, because
// they depend on the charges and nothing depends on them.

import type { SundryRow, TaxComponent } from '../data/schema/sundry'
import { sumPaise, type Paise } from './money'
import type { Band, PlaceOfSupply } from './tax'

/** What the item grid contributes: the money, and the number of units for a per-unit charge.
 * Quantity is the total across filled rows — a per-unit charge is per unit of goods, and an
 * invoice for eight items of four is thirty-two units, not eight. */
export type Goods = { subtotalPaise: Paise; quantity: number }

export type Sundries = {
  /** The same rows, with what each came to filled in. Order is untouched. */
  rows: SundryRow[]
  /** Every ordinary charge added up. This is the Bill sundry line in the breakdown. */
  chargesPaise: Paise
  /** The charges tax is due on. Not shown anywhere; it is the base the tax rows use. */
  taxableChargesPaise: Paise
}

function amountOf(row: SundryRow, goods: Goods, basePaise: Paise): Paise {
  if (row.kind === 'flat') return Math.round(row.value)
  if (row.kind === 'perUnit') return Math.round(row.value * goods.quantity)
  return Math.round((basePaise * row.value) / 100)
}

/** A row nobody has picked a charge for yet is not a charge. It sits there waiting, exactly
 * like an item row with no item, and it contributes nothing. */
const isFilled = (row: SundryRow) => row.sundryId !== null

export function applySundries(goods: Goods, rows: readonly SundryRow[]): Sundries {
  const charges = rows.map((row) =>
    isFilled(row) && row.taxComponent === null ? { ...row, amountPaise: amountOf(row, goods, goods.subtotalPaise) } : row,
  )

  const chargeRows = charges.filter((row) => isFilled(row) && row.taxComponent === null)
  const chargesPaise = sumPaise(chargeRows.map((row) => row.amountPaise))
  const taxableChargesPaise = sumPaise(chargeRows.filter((row) => row.taxable).map((row) => row.amountPaise))

  const taxBasePaise = goods.subtotalPaise + taxableChargesPaise
  const settled = charges.map((row) =>
    isFilled(row) && row.taxComponent !== null ? { ...row, amountPaise: amountOf(row, goods, taxBasePaise) } : row,
  )

  // NO `taxPaise` HERE. It summed the generated tax rows and its own comment called it "the Tax
  // line in the breakdown" — which is drawn from totals.ts, computed from the tax bands, and
  // has never read this. Two places adding up the same money is how they come to disagree, and
  // the one nothing reads is the one that would have drifted unnoticed. Removed 24-08; the only
  // thing keeping it alive was three assertions in its own test.
  return { rows: settled, chargesPaise, taxableChargesPaise }
}

/** The rows bill-wise mode makes for itself: one per tax component, per rate band used on the
 * invoice. Goods at 5%, 12% and 18% sold inside the state therefore make SIX rows — CGST and
 * SGST at each of three rates — and not one pair. A single pair would have to invent an
 * average rate, and an average rate is not a rate anybody can file.
 *
 * They are read-only on the screen. Their value is arithmetic, and a field that lets you type
 * over arithmetic is a field that lets you file a wrong return.
 */
export function generateTaxRows(taxBands: readonly Band[], place: PlaceOfSupply): SundryRow[] {
  const components: TaxComponent[] = place === 'intra' ? ['cgst', 'sgst'] : ['igst']

  return taxBands
    .filter((band) => band.percent > 0)
    .flatMap((band) =>
      components.map((component) => {
        // Inside the state the rate splits in half between the two components; across a
        // border IGST carries the whole of it.
        const percent = place === 'intra' ? band.percent / 2 : band.percent
        return {
          id: `tax-${component}-${band.percent}`,
          sundryId: `sundry-${component}`,
          name: `${component.toUpperCase()} ${percent}%`,
          kind: 'percent' as const,
          value: percent,
          amountPaise: Math.round((band.taxablePaise * percent) / 100),
          taxable: false,
          taxComponent: component,
        }
      }),
    )
}
