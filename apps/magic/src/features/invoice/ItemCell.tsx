// The item cell, which is the ItemPicker with the grid's data behind it. Separate from Cell
// because it is the only cell that talks to the adapter, and Cell should not have to know
// that any cell does.

import { useEffect, useRef, useState, type RefObject } from 'react'

import { ItemDrawer } from './ItemDrawer'
import { ItemPicker } from './ItemPicker'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import type { Item } from '../../data/schema/item'
import type { InvoiceRow } from '../../data/schema/invoice'
import { useInvoice } from './store'
import { onEnter } from '../../lib/keyboard'
import { actionFor } from '../../lib/shortcuts'
import { Shortcut } from '@busy/ui/Shortcut'

export function ItemCell({
  row,
  index,
  invalid,
  inputRef,
}: {
  row: InvoiceRow
  index: number
  invalid: boolean
  inputRef: RefObject<HTMLInputElement | null>
}) {
  const [search, setSearch] = useState(row.itemName)
  const shownRow = useRef(row.id)
  // ARMED ON ARRIVAL, NOT ONLY ON LATE ARRIVAL. This cell only mounts when the cursor reaches it,
  // so mounting over a row that already has a name IS the cursor landing on a filled cell — and
  // that is the ordinary case on a loaded invoice. It used to start `false` and be armed only by
  // the effect below, which fires when the name arrives AFTER the cell, so the selection happened
  // on a slow invoice and never on a loaded one. The journey that covers this passed for months
  // because it was walking an invoice whose rows had not turned up yet: typing appended, the
  // search matched nothing, and the list silently never opened.
  const selectOnNextPaint = useRef(row.itemName !== '')

  // The invoice arrives after this cell has mounted, so the name has to be picked up when it
  // does — otherwise row one shows an empty item cell over a row that has one. And the value
  // is selected as it lands, because the cursor is already sitting here: without that, the
  // next thing typed is added to the name instead of replacing it, nothing matches, and the
  // list silently never opens.
  useEffect(() => {
    if (shownRow.current !== row.id || (search === '' && row.itemName !== '')) {
      shownRow.current = row.id
      setSearch(row.itemName)
      selectOnNextPaint.current = true
    }
  }, [row.id, row.itemName, search])

  // Selecting has to wait until React has put the new value into the field. Doing it in the
  // same pass as the change sets the selection and then loses it, because writing an input's
  // value drops the caret at the end.
  useEffect(() => {
    if (!selectOnNextPaint.current) return
    const input = inputRef.current
    if (!input) return

    // IT WAITS FOR THE KEYBOARD RATHER THAN HOPING TO CATCH IT. The cell mounts a beat before the
    // grid gives it focus, and this effect's dependencies do not include focus — so the old code
    // ran once, found the field not focused, threw the flag away and never asked again. That is
    // why the selection only ever happened on an invoice whose rows arrived LATE: the name
    // changing re-ran the effect at a moment when focus was already here.
    const take = () => {
      selectOnNextPaint.current = false
      input.select()
    }
    if (document.activeElement === input) {
      take()
      return undefined
    }
    input.addEventListener('focus', take, { once: true })
    return () => input.removeEventListener('focus', take)
  }, [search, inputRef])
  const [options, setOptions] = useState<readonly Item[]>([])
  const applyItem = useInvoice((state) => state.applyItem)
  const setItemText = useInvoice((state) => state.setItemText)
  const moveTo = useInvoice((state) => state.moveTo)
  /** What was typed when the drawer was asked for, or null while it is shut. */
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    void data.listItems(search).then((answer) => {
      if (!current) return
      setOptions(isRefusal(answer) ? [] : answer)
    })
    return () => {
      current = false
    }
  }, [search])

  // F10 OPENS THE DRAWER ON WHAT HAS BEEN TYPED, and it is the only keyboard door the drawer has.
  // Before this it opened from the list's "+ Create item" row and from nowhere else — a mouse-only
  // path to the one place an item gets a unit, a tax category and an HSN.
  //
  // WHAT DOES NOT CHANGE IS TAB AND ENTER. Both carry on into the line, and a name matching
  // nothing behaves exactly like one that matches: the item is created when the line is saved.
  // That is Aj's 20-08 ruling, asked again on 25-08 and withdrawn once it was shown to reverse
  // itself — adding a line is the fifty-times-an-invoice path and a drawer in the middle of it is
  // a wall. This key is the other case, asked for deliberately.
  //
  // ON A WRAPPER THAT DRAWS NOTHING. `display: contents` puts no box in the grid — the cell's
  // layout is untouched — while events still travel through it, because bubbling follows the DOM
  // and not the box tree. The alternative was a prop on `ComboBox`, which is the other session's.
  function onKeyDown(event: React.KeyboardEvent<HTMLSpanElement>) {
    // Which key this is comes from the one table, like every other shortcut in the product.
    if (actionFor(event) !== 'open-master') return
    event.preventDefault()
    event.stopPropagation()
    setCreating(search.trim())
  }

  return (
    <span className="group/item contents" onKeyDown={onKeyDown}>
    <ItemPicker
      listId={`item-list-${row.id}`}
      // The create row opens the drawer. Typing a name nothing matches and carrying on still
      // creates the item when the line is saved — that is the fifty-times-an-invoice path and
      // a drawer in the middle of it would be a wall. This is the other case: the item needs a
      // unit, a tax category and an HSN before it can be billed properly.
      onCreate={() => setCreating(search.trim())}
      inputRef={inputRef}
      value={search}
      invalid={invalid}

      onValueChange={(next) => {
        setSearch(next)
        setItemText(index, next)
      }}
      options={options}
      onSelect={(item) => {
        setSearch(item.name)
        applyItem(index, item)
        // Picking an item moves the cursor on to Qty, which already holds its default.
        moveTo(onEnter({ row: index, column: 'item' }, Number.POSITIVE_INFINITY))
      }}
    />

    {/* THE SAME CAP THE PARTY FIELD WEARS, and the same behaviour: shown only while the cell is
        hovered or holds the keyboard. A shortcut hint that is on all the time is a permanent
        label on every row of the grid. It is not a control — pressing a cap is not how a
        shortcut is used — so it takes no pointer events and no place in the tab order. */}
    <Shortcut
      keyName="F10"
      className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 opacity-0 transition-opacity group-hover/item:opacity-100 group-focus-within/item:opacity-100"
    />

    <ItemDrawer
      typed={creating}
      onClose={() => setCreating(null)}
      onCreated={(item) => {
        setCreating(null)
        setSearch(item.name)
        applyItem(index, item)
        moveTo(onEnter({ row: index, column: 'item' }, Number.POSITIVE_INFINITY))
      }}
    />
    </span>
  )
}
