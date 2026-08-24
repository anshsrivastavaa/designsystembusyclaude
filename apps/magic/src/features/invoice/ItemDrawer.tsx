// The item drawer: the same shape as the party one, opened from the item picker.
//
// IT IS THE SECOND WAY TO MAKE AN ITEM, NOT THE ONLY ONE, and the two are not the same act.
// Typing a name nothing matches and carrying on creates the item when the line is saved —
// that is the fifty-times-an-invoice path and a drawer in the middle of it would be a wall.
// This is for the other case: the item needs a unit, a tax category and an HSN before it can
// be billed properly, and answering that later somewhere else means answering it wrong.
//
// v2 SHIPS BOTH AND DOES NOT SAY WHICH YOU ARE GETTING — its picker note promises the item
// will be created on save while its create row opens a form. So the row says which: "Create
// with details" opens this, and typing on creates the item as before.
//
// SIX FIELDS, THEN THE REST BEHIND THE FOLD, matching the party drawer exactly. Two drawers
// with the same job and different shapes is two things to learn instead of one.

import { useEffect, useRef, useState } from 'react'

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { Icon } from '@busy/ui/Icon'
import { actionFor } from '../../lib/shortcuts'
import { toPaise } from '../../lib/money'
import type { Item } from '../../data/schema/item'
import { DrawerField, DrawerGrid, DrawerMore } from './DrawerField'

const UNITS = ['Nos', 'Kgs', 'Box', 'Dozen', 'Mtr', 'Ltr']
const GROUPS = ['General', 'Cement', 'Steel', 'Hardware']
const TAX = ['GST 0%', 'GST 5%', 'GST 12%', 'GST 18%', 'GST 28%']

const BLANK = {
  name: '', unit: UNITS[0]!, group: GROUPS[0]!, salePrice: '', tax: TAX[3]!, hsn: '',
  alias: '', printName: '', purchasePrice: '', mrp: '', minPrice: '', openingQty: '', description: '',
}

type ItemDrawerProps = {
  /** What was typed in the cell, or null when the drawer is shut. */
  typed: string | null
  onClose: () => void
  onCreated: (item: Item) => void
}

export function ItemDrawer({ typed, onClose, onCreated }: ItemDrawerProps) {
  const [draft, setDraft] = useState(BLANK)
  const [checked, setChecked] = useState(false)
  const first = useRef<HTMLInputElement>(null)

  // What was typed IS the name — the one thing already answered before the drawer opened.
  useEffect(() => {
    if (typed === null) return
    setDraft({ ...BLANK, name: typed.trim() })
    setChecked(false)
  }, [typed])

  const put = (key: keyof typeof draft) => (value: string) => setDraft((was) => ({ ...was, [key]: value }))

  function create() {
    if (draft.name.trim() === '') return
    // The rate is read off the tax category rather than typed twice, so the two can never
    // disagree on one item.
    const rate = Number.parseFloat(draft.tax.replace(/[^\d.]/g, '')) || 0
    onCreated({
      id: `item-new-${draft.name.trim().toLowerCase().replace(/\s+/g, '-')}`,
      name: draft.name.trim(),
      alias: draft.alias.trim(),
      barcode: '',
      units: [{ code: draft.unit, label: draft.unit }],
      defaultUnit: draft.unit,
      pricePaise: toPaise(draft.salePrice.trim() === '' ? '0' : draft.salePrice),
      costPaise: toPaise(draft.purchasePrice.trim() === '' ? '0' : draft.purchasePrice),
      taxPercent: rate,
      // Added mechanically on 21-08 when the item schema grew these, so this file keeps
      // compiling — the item strip needs them and an item invented at the counter has no
      // history yet. Whoever owns this drawer decides whether it should ASK for the HSN.
      hsn: '',
      lastRatePaise: 0,
      listRatePaise: 0,
      mrpPaise: 0,
      // Everything here is taxable: the drawer offers GST rates and nothing else. Nil, exempt
      // and zero-rated are real states an item can be in and none of them is a rate, so they
      // belong on a master screen with room to say what each means — not guessed at from a
      // percentage picked in a hurry.
      taxTreatment: 'taxable',
      cessPercent: 0,
      stock: draft.openingQty.trim() === '' ? 0 : Number.parseFloat(draft.openingQty),
    })
  }

  return (
    <Drawer
      open={typed !== null}
      onClose={onClose}
      title="Create Item"
      returnFocus={false}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-secondary">F2 creates it</span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={create} disabled={draft.name.trim() === ''}>
              Save Item
            </Button>
          </div>
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          create()
        }}
        onKeyDown={(event) => {
          if (actionFor(event) !== 'create-record') return
          event.preventDefault()
          create()
        }}
      >
        <DrawerGrid>
          <DrawerField label="Name" required wide value={draft.name} onChange={put('name')} inputRef={first} />
          <DrawerField label="Unit" required value={draft.unit} onChange={put('unit')} options={UNITS} />
          <DrawerField label="Group" required value={draft.group} onChange={put('group')} options={GROUPS} />
          <DrawerField label="Sale price" value={draft.salePrice} onChange={put('salePrice')} align="end" />
          <DrawerField label="Tax category" required value={draft.tax} onChange={put('tax')} options={TAX} />
          <DrawerField label="HSN / SAC" wide value={draft.hsn} onChange={put('hsn')}>
            <Button variant="ghost" size="sm" onClick={() => setChecked(draft.hsn.trim() !== '')}>
              Validate
            </Button>
          </DrawerField>
        </DrawerGrid>

        {checked ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-success">
            <Icon name="tick" className="size-icon-sm" />
            HSN checked
          </p>
        ) : null}

        <DrawerMore label="Expand to full master">
          <DrawerGrid>
            <DrawerField label="Alias" value={draft.alias} onChange={put('alias')} />
            <DrawerField label="Print name" value={draft.printName} onChange={put('printName')} />
            <DrawerField label="Purchase price" value={draft.purchasePrice} onChange={put('purchasePrice')} align="end" />
            <DrawerField label="MRP" value={draft.mrp} onChange={put('mrp')} align="end" />
            <DrawerField label="Minimum sale price" value={draft.minPrice} onChange={put('minPrice')} align="end" />
            <DrawerField label="Opening quantity" value={draft.openingQty} onChange={put('openingQty')} align="end" />
            <DrawerField label="Item description" wide value={draft.description} onChange={put('description')} />
          </DrawerGrid>
        </DrawerMore>
      </form>
    </Drawer>
  )
}
