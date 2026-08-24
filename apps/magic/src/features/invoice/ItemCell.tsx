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
  const selectOnNextPaint = useRef(false)

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
    selectOnNextPaint.current = false
    const input = inputRef.current
    if (input && document.activeElement === input) input.select()
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

  return (
    <>
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
    </>
  )
}
