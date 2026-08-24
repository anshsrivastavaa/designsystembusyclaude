// One shape, four jobs: it validates what the user typed, it generates the TypeScript type
// so the two can never drift, it shapes the mock world so the mock cannot describe an
// impossible item, and printed out it is the specification the backend team builds against.

import { z } from 'zod'

export const unitSchema = z.object({
  code: z.string().min(1),
  label: z.string().min(1),
})

/** WHY A RATE OF ZERO IS NOT ENOUGH. Four different things are all "no tax on this line", and
 * a return has to tell them apart: NIL-RATED goods carry a rate of nil; EXEMPT goods are
 * exempted from tax that would otherwise apply; ZERO-RATED is an export or an SEZ supply,
 * where the rate is zero and input credit is still claimable. Storing 0% for all three loses
 * the distinction the tax summary exists to show, and v2 left all of them out because every
 * row would have read as a dash. */
export const taxTreatmentSchema = z.enum(['taxable', 'nil', 'exempt', 'zeroRated'])

export const itemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  // The item column searches by name, alias or barcode, so all three are part of the item.
  alias: z.string(),
  barcode: z.string(),
  // Empty when the item is not sold by a unit at all, which is what decides whether quantity
  // defaults to one or to nothing.
  units: z.array(unitSchema),
  defaultUnit: z.string().nullable(),
  pricePaise: z.number().int().nonnegative(),
  /** What it cost us. The owner sees the margin; an operator does not, which is a right on
   * the user rather than a property of the item — the field is here either way, because a
   * screen that hides a number still has to be given it or it cannot hide anything. */
  costPaise: z.number().int().nonnegative(),
  /** The HSN or SAC code this is classified under. It decides the rate, so the strip shows the
   * two together — a rate without its code is a number nobody can check against a return. */
  hsn: z.string(),
  /** What THIS customer paid last time, and what the price list says. Both are facts the
   * operator wants while typing a price and neither belongs in a column: they are about one
   * row, at one moment, and a column of them would be read down. */
  lastRatePaise: z.number().int(),
  listRatePaise: z.number().int(),
  /** The printed maximum. Shown as a column where a shop sells at it, and never editable on a
   * line: it is a fact about the packet, not about this sale. */
  mrpPaise: z.number().int(),
  taxPercent: z.number().nonnegative(),
  taxTreatment: taxTreatmentSchema,
  /** Compensation cess, on top of GST, on a handful of goods. Zero for nearly everything. */
  cessPercent: z.number().nonnegative(),
  stock: z.number(),
})

export type Unit = z.infer<typeof unitSchema>
export type TaxTreatment = z.infer<typeof taxTreatmentSchema>
export type Item = z.infer<typeof itemSchema>
