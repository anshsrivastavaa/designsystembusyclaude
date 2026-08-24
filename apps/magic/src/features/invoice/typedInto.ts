import { toPaise } from '../../lib/money'
import type { ColumnId } from '../../lib/keyboard'
import type { InvoiceRow } from '../../data/schema/invoice'

/** A number this arithmetic can hold. `Number(typed) || 0` accepts "Infinity" and "1e30" —
 * one makes every total Infinity, the other passes the point where whole numbers stop being
 * exact, and both are typed rather than pasted. */
function aNumber(typed: string): number {
  const value = Number(typed)
  if (!Number.isFinite(value)) return 0
  if (Math.abs(value) > Number.MAX_SAFE_INTEGER / 100) return 0
  return value
}

/** WHAT TYPING INTO A COLUMN CHANGES ON THE ROW.
 *
 * Five of the six editable columns are the same idea — one field, and the conversion its type
 * needs — so they are a table rather than five near-identical actions. `amount` is not here
 * because it is the one that does not write its own field: it works the price backwards and
 * needs the row to do it.
 *
 * This replaced six store actions with identical signatures, six props on EditableCell and an
 * if/else that dispatched to them on the column the component was already holding. */
export
const TYPED_INTO: Partial<Record<ColumnId, (typed: string) => Partial<InvoiceRow>>> = {
  quantity: (typed) => ({ quantity: aNumber(typed) }),
  price: (typed) => ({ pricePaise: toPaise(typed) }),
  unit: (typed) => ({ unit: typed }),
  discount: (typed) => ({ discountPercent: aNumber(typed) }),
  freeQuantity: (typed) => ({ freeQuantity: aNumber(typed) }),
}

