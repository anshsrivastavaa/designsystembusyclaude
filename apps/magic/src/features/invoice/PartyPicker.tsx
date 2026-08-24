// A picker holds row content and nothing else.
//
// The row is two lines: the name on its own, then the city and the balance together
// underneath. The name is what you are scanning for, so nothing shares its line. The other
// two are what you check once you have found it, and they belong together on the second.
//
// The balance shows on every row, not only the highlighted one, because it is how you tell
// two similar names apart before you have arrowed onto either. That differs from ItemPicker
// on purpose: stock is a detail you check about the item you have already found.

import type { Ref } from 'react'

import { ComboBox } from '@busy/ui/ComboBox'
import { formatBalancePaise } from '../../lib/money'
import type { Party } from '../../data/schema/party'

type PartyPickerProps = {
  value: string
  onValueChange: (value: string) => void
  /** Recent first, then the rest. The grouping only marks where the heading goes. */
  options: readonly Party[]
  recentIds: readonly string[]
  onSelect: (party: Party) => void
  onCreate: () => void
  /** Focus left the field and the search had found nothing. */
  onLeaveUnmatched: () => void
  listId: string
  inputRef?: Ref<HTMLInputElement>
  invalid?: boolean
}

export function PartyPicker({
  value,
  onValueChange,
  options,
  recentIds,
  onSelect,
  onCreate,
  onLeaveUnmatched,
  listId,
  inputRef,
  invalid,
}: PartyPickerProps) {
  return (
    <ComboBox
      label="Party"
      // Name, mobile or GSTIN. The city is on every row and searched by none of them —
      // nobody types a city to find a customer.
      placeholder="Name, mobile or GSTIN…"
      listId={listId}
      value={value}
      onValueChange={onValueChange}
      options={options}
      getKey={(party) => party.id}
      onSelect={onSelect}
      // The party field is a destination, focused once per invoice, so the list is waiting
      // when you arrive. The item cell in the grid is not — see the note on this prop.
      openOnFocus
      // Both halves get a heading. With only "Recent" labelled, the list read as three
      // parties and a create row — the rest was there and looked like it was not.
      groupOf={(party) => (recentIds.includes(party.id) ? 'Recent' : 'All parties')}
      stickyAction={{ label: '+ Create party', onChoose: onCreate }}
      onLeave={onLeaveUnmatched}
      {...(inputRef ? { inputRef } : {})}
      {...(invalid === undefined ? {} : { invalid })}
      renderRow={(party) => (
        <span className="flex flex-col gap-0.5">
          <span className="truncate text-ink">{party.name}</span>
          <span className="flex items-baseline justify-between gap-4 text-sm text-ink-secondary">
            <span className="truncate">{party.city || '—'}</span>
            <span className="shrink-0">{formatBalancePaise(party.outstandingPaise)}</span>
          </span>
        </span>
      )}
    />
  )
}
