// A picker holds row content and nothing else. The moment this file starts holding search
// rules, validation or an API shape, it has stopped being a wrapper — the 250-line rule will
// catch that, but it will catch it late.
//
// The row shows item name and stock, and stock shows on the HIGHLIGHTED row alone: hovered
// for a mouse, arrowed-to for a keyboard. No rate and no MRP.

import type { Ref } from 'react'

import { ComboBox } from '@busy/ui/ComboBox'
import type { Item } from '../../data/schema/item'

type ItemPickerProps = {
  value: string
  onValueChange: (value: string) => void
  options: readonly Item[]
  onSelect: (item: Item) => void
  onDismiss?: () => void
  listId: string
  invalid?: boolean
  inputRef?: Ref<HTMLInputElement>
  /** Keep what was typed and move on. No drawer. */
  onCreate: () => void
}

export function ItemPicker({
  value,
  onValueChange,
  options,
  onSelect,
  onDismiss,
  listId,
  invalid,
  inputRef,
  onCreate,
}: ItemPickerProps) {
  return (
    <ComboBox
      label="Item"
      placeholder="Search items…"
      listId={listId}
      value={value}
      onValueChange={onValueChange}
      options={options}
      getKey={(item) => item.id}
      onSelect={onSelect}
      {...(onDismiss ? { onDismiss } : {})}
      {...(invalid === undefined ? {} : { invalid })}
      {...(inputRef ? { inputRef } : {})}
      // The item cell NEVER opens its list on arrival, and this reverses an earlier ruling.
      // An auto-opening list has to capture Down to be usable, and Down is also how you move
      // down the grid — one cell cannot have both. Typing opens it on the first keystroke,
      // which is what happens anyway. The party field still opens on focus, because there is
      // no row beneath it to conflict with.
      // A name that matches nothing does NOT open a drawer. The strip says a new item will be
      // created and the user carries on typing — which is the v2 behaviour, and the opposite
      // of the party field on purpose. Adding an item happens fifty times an invoice; adding
      // a party happens once, and only sometimes.
      //
      // It is a note rather than a row you can land on, so Enter still belongs to the grid and
      // carries on to Qty instead of being caught here.
      // The same sticky foot the party list has, never scrolled away. Choosing it keeps what
      // was typed as the item name and carries on — a name that matches nothing is created by
      // typing it, and no drawer opens. Adding an item happens fifty times an invoice.
      stickyAction={{
        // "with details" because there are TWO ways to make an item and they are not the same
        // act: typing a name nothing matches and carrying on creates it when the line is saved,
        // and this opens the drawer for the one that needs a unit, a tax category and an HSN.
        // v2 ships both and its row does not say which you are getting.
        label: value.trim() === '' ? '+ Create item with details' : `+ Create “${value.trim()}” with details`,
        onChoose: onCreate,
      }}
      {...(options.length === 0 && value.trim() !== ''
        ? { note: `“${value.trim()}” is new — it will be created when this line is saved` }
        : {})}
      renderRow={(item, { highlighted }) => (
        <span className="flex items-baseline justify-between gap-4">
          <span>{item.name}</span>
          {highlighted ? <span className="text-sm text-ink-secondary">{item.stock} in stock</span> : null}
        </span>
      )}
    />
  )
}
