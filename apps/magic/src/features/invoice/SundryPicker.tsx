// A picker holds row content and nothing else. The row shows the charge's name and how it is
// worked out, because "Freight" alone does not tell you whether picking it will add 500.00 or
// 2% of the goods.
//
// THE TAX COMPONENTS ARE NOT IN THIS LIST IN ANY MODE. CGST, SGST, IGST and Cess are never
// picked by hand: in bill-wise mode the invoice generates them itself, one per component per
// rate band, and in the item-level modes tax lives on the rows instead. The adapter leaves
// them out of the search, so "blocked in item-level modes" is stronger than a rule — there is
// nothing to block, because there is nothing to pick.

import type { Ref } from 'react'

import { ComboBox } from '@busy/ui/ComboBox'
import type { SundryMaster } from '../../data/schema/sundry'
import { formatPaise } from '../../lib/money'

/** What picking it will do, in the words the operator already uses. */
function worksOutAs(sundry: SundryMaster): string {
  if (sundry.kind === 'percent') return `${sundry.defaultValue}% of the goods`
  if (sundry.kind === 'perUnit') return `${formatPaise(sundry.defaultValue)} per unit`
  return formatPaise(sundry.defaultValue)
}

type SundryPickerProps = {
  value: string
  onValueChange: (value: string) => void
  options: readonly SundryMaster[]
  onSelect: (sundry: SundryMaster) => void
  listId: string
  inputRef?: Ref<HTMLInputElement>
  /** The charges this party had last time. Offered as one pinned row above the list, because
   * the same party takes the same charges over and over and picking them one at a time is the
   * same three keystrokes every invoice. Absent when the party has no history. */
  lastUsed?: readonly SundryMaster[]
  onAddLastUsed: () => void
  /** Invent this charge, and write how it is worked out back to the master.
   *
   * OMITTED FOR NOW, ON PURPOSE, and the row is not offered when it is. Inventing a charge has
   * to ask how it is worked out — a percentage of the goods, a flat amount, or per unit — and
   * write that choice back to the master, because the master owns the kind. Until that asking
   * exists, the row would be a control that does nothing, and this codebase's rule is that a
   * control which does nothing is worse than none: it was offered, it was pressed, it left the
   * typed text sitting in an unpicked row, and it cost an afternoon to find. */
  onCreate?: () => void
}

export function SundryPicker({
  value,
  onValueChange,
  options,
  onSelect,
  listId,
  inputRef,
  lastUsed,
  onAddLastUsed,
  onCreate,
}: SundryPickerProps) {
  const named = lastUsed?.map((sundry) => sundry.name).join(', ')

  return (
    <ComboBox
      label="Bill sundry"
      placeholder="Search charges…"
      listId={listId}
      value={value}
      onValueChange={onValueChange}
      options={options}
      getKey={(sundry) => sundry.id}
      onSelect={onSelect}
      {...(inputRef ? { inputRef } : {})}
      {...(lastUsed && lastUsed.length > 0
        ? { stickyLead: { label: `Add last used · ${named}`, onChoose: onAddLastUsed } }
        : {})}
      {...(onCreate === undefined
        ? {}
        : {
            stickyAction: {
              label: value.trim() === '' ? '+ Create a bill sundry' : `+ Create "${value.trim()}" as a bill sundry`,
              onChoose: onCreate,
            },
          })}
      renderRow={(sundry) => (
        <div className="flex items-baseline justify-between gap-4">
          <span className="truncate text-ink">{sundry.name}</span>
          <span className="shrink-0 text-sm text-ink-muted">{worksOutAs(sundry)}</span>
        </div>
      )}
    />
  )
}
