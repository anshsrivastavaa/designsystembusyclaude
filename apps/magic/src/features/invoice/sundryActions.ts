// What the charges on an invoice do when somebody edits them.
//
// Its own file because the store had become two things: an invoice of item rows with a cursor
// walking them, and a list of charges with no cursor at all. They share a store because they
// share an invoice, and they share nothing else.

import { toPaise } from '../../lib/money'
import { emptySundryRow, type SundryMaster, type SundryRow } from '../../data/schema/sundry'

export type SundryActions = {
  sundries: SundryRow[]
  /** Fill a sundry row from the master. What it COMES TO is never stored — the breakdown works
   * it out — so a charge cannot go stale against the goods it is a percentage of. */
  pickSundry: (index: number, master: SundryMaster) => void
  setSundryValue: (index: number, typed: string) => void
  removeSundryRow: (index: number) => void
  /** The charges this party had last time, added in one go. */
  addSundries: (masters: readonly SundryMaster[]) => void
}

/** Two blank rows on a fresh invoice; ONE blank waiting at the end once anything is filled.
 * The item grid's rule, and the reason is the same: a row you can type into has to be there
 * before you want it, and a second empty one below it is just a hole in the list. */
function withTrailingBlank(rows: SundryRow[]): SundryRow[] {
  const filled = rows.filter((row) => row.sundryId !== null)
  if (filled.length === 0) return rows.slice(0, 2)
  return [...filled, emptySundryRow(`sundry-row-${filled.length}`)]
}


type Apply = (fn: (state: SundryActions) => Partial<SundryActions>) => void

export function sundryActions(set: Apply): SundryActions {
  return {
    // Two blank rows on a fresh invoice, then one trailing blank once anything is filled — the
    // item grid's rule, applied to the charges.
    sundries: [emptySundryRow('sundry-row-0'), emptySundryRow('sundry-row-1')],

    pickSundry: (index, master) =>
      set((state) => {
        const rows = state.sundries.slice()
        const row = rows[index]
        if (!row) return {}
        rows[index] = {
          ...row,
          sundryId: master.id,
          name: master.name,
          kind: master.kind,
          value: master.defaultValue,
          taxable: master.taxable,
          taxComponent: master.taxComponent,
        }
        return { sundries: withTrailingBlank(rows) }
      }),

    setSundryValue: (index, typed) =>
      set((state) => {
        const rows = state.sundries.slice()
        const row = rows[index]
        if (!row) return {}
        // A percentage is typed as a percentage; everything else is typed in rupees and held in
        // paise, the same as a price. Grouping commas are stripped rather than trusted to
        // Number(), which reads "1,500.00" as NaN — a charge over 999.99 became zero.
        const value = Number(typed.replace(/,/g, ''))
        const clean = Number.isFinite(value) ? value : 0
        rows[index] = { ...row, value: row.kind === 'percent' ? clean : toPaise(clean) }
        return { sundries: rows }
      }),

    removeSundryRow: (index) =>
      set((state) => {
        const rows = state.sundries.filter((_, at) => at !== index)
        return { sundries: withTrailingBlank(rows.length === 0 ? [emptySundryRow('sundry-row-0'), emptySundryRow('sundry-row-1')] : rows) }
      }),

    addSundries: (masters) =>
      set((state) => {
        const filled = state.sundries.filter((row) => row.sundryId !== null)
        const added = masters.map((master, at) => ({
          id: `sundry-row-${filled.length + at}`,
          sundryId: master.id,
          name: master.name,
          kind: master.kind,
          value: master.defaultValue,
          amountPaise: 0,
          taxable: master.taxable,
          taxComponent: master.taxComponent,
        }))
        return { sundries: withTrailingBlank([...filled, ...added]) }
      }),
  }
}
