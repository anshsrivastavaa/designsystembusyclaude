// One row of the bill sundry grid: what the charge is, how it is worked out, what the operator
// typed, and what it came to.
//
// WHAT IT CAME TO IS NOT STORED. The row holds the charge and the number typed against it; the
// breakdown works out the amount from the goods every time. A stored amount goes stale the
// moment a line changes, and a stale percentage is a charge that disagrees with the invoice it
// is on.

import { useEffect, useState } from 'react'

import { TextField } from '@busy/ui/TextField'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import type { SundryMaster, SundryRow } from '../../data/schema/sundry'
import { formatPaise } from '../../lib/money'
import { DeleteSundry } from './DeleteSundry'
import { SUNDRY_WIDTHS } from './sundryColumns'
import { SundryPicker } from './SundryPicker'
import { useInvoice } from './store'

/** The word for how it is worked out, in the operator's language rather than the code's. */
const KIND_WORD: Record<SundryRow['kind'], string> = { percent: '%', flat: 'Flat', perUnit: 'Per unit' }

export function SundryLine({ row, index, amountPaise }: { row: SundryRow; index: number; amountPaise: number }) {
  const pickSundry = useInvoice((state) => state.pickSundry)
  const setSundryValue = useInvoice((state) => state.setSundryValue)
  const addSundries = useInvoice((state) => state.addSundries)
  const party = useInvoice((state) => state.party)

  const [search, setSearch] = useState(row.name)

  // The row can be filled from somewhere other than this field — the pinned "add last used"
  // row fills several at once — and the field has to show what the row now holds. Without
  // this the charge arrives with its type and its amount and no name, which is the row
  // looking broken while being entirely correct.
  useEffect(() => {
    setSearch(row.name)
  }, [row.name])
  const [options, setOptions] = useState<SundryMaster[]>([])
  const [lastUsed, setLastUsed] = useState<SundryMaster[]>([])

  useEffect(() => {
    void data.listSundries(search).then((answer) => {
      if (!isRefusal(answer)) setOptions(answer)
    })
  }, [search])

  useEffect(() => {
    if (!party) return
    void data.lastUsedSundries(party.id).then((answer) => {
      if (!isRefusal(answer)) setLastUsed(answer)
    })
  }, [party])

  // WHAT THE FIELD SHOWS IS A DRAFT, NOT THE STORED NUMBER, and this is the same reason
  // EditableCell gives for the item grid. Reading the store back through formatPaise made
  // "1,500.00" — and Number("1,500.00") is NaN, which fell to zero. So a flat charge over
  // 999.99 silently became nothing the moment anybody touched it, and only over 999.99,
  // because that is where the grouping comma appears.
  //
  // Grouped while it rests, plain while it is being typed in: a comma is for reading, and a
  // field being typed in is not being read.
  const [draft, setDraft] = useState<string | null>(null)
  const asRupees = row.kind === 'percent' ? String(row.value) : (row.value / 100).toFixed(2)
  const typed = draft ?? (row.kind === 'percent' ? String(row.value) : formatPaise(row.value))

  return (
    <div role="row" className="group flex h-row items-stretch border-b border-stroke last:rounded-b-card last:border-b-0">
      <div role="gridcell" className={`flex h-full items-center border-r border-stroke px-1 ${SUNDRY_WIDTHS.name}`}>
        <SundryPicker
          listId={`sundry-list-${row.id}`}
          value={search}
          onValueChange={setSearch}
          options={options}
          onSelect={(master) => {
            setSearch(master.name)
            pickSundry(index, master)
          }}
          lastUsed={lastUsed}
          onAddLastUsed={() => addSundries(lastUsed)}
        />
      </div>

      <div role="gridcell" className={`flex h-full items-center border-r border-stroke px-2 text-body text-ink-secondary ${SUNDRY_WIDTHS.type}`}>
        {row.sundryId === null ? '' : KIND_WORD[row.kind]}
      </div>

      <div role="gridcell" className={`flex h-full items-center border-r border-stroke px-1 ${SUNDRY_WIDTHS.value}`}>
        {row.sundryId === null ? null : (
          <TextField
            aria-label={`${row.name} value`}
            value={typed}
            onFocus={() => setDraft(asRupees)}
            onBlur={() => setDraft(null)}
            onChange={(event) => {
              setDraft(event.target.value)
              setSundryValue(index, event.target.value)
            }}
            className="text-right"
          />
        )}
      </div>

      {/* THE DELETE SITS AT THE END OF THE ROW, IN THE AMOUNT CELL — v2's arrangement. It is
          where the row finishes and where the eye already is, and it costs no column. */}
      <div role="gridcell" className={`flex h-full items-center justify-end gap-1 px-2 text-body text-ink-secondary ${SUNDRY_WIDTHS.amount}`}>
        {row.sundryId === null ? '' : formatPaise(amountPaise)}
        <DeleteSundry index={index} filled={row.sundryId !== null} />
      </div>
    </div>
  )
}
