// The party drawer, opened by typing something the search could not find and then leaving the
// field. Not by pressing a button: adding a party happens once an invoice and only sometimes,
// so it is what you do when the search comes back empty rather than a thing sitting on screen
// waiting to be clicked.
//
// Deliberately unlike the item strip. An item that does not exist is created by carrying on
// typing, because that happens fifty times an invoice. A party is a record with a GSTIN and a
// balance, so it gets a form.
//
// SIX FIELDS, THEN NINE MORE BEHIND "EXPAND TO FULL MASTER". v2's own division, and it is the
// right one: the six are what you cannot raise an invoice without, and the nine are what the
// party master eventually wants. Showing fifteen at once turns a two-field interruption into a
// form somebody abandons; showing six with no way through means the master gets filled in
// later, somewhere else, by somebody who has forgotten the context.
//
// IT WAS CALLED NewParty. Renamed rather than added beside, because a second file for a thing
// that already exists is the defect this codebase is arranged against — and PartyDrawer is what
// it is: one drawer, matching ItemDrawer next to it.

import { useEffect, useRef, useState } from 'react'

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { Icon } from '@busy/ui/Icon'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { actionFor } from '../../lib/shortcuts'
import type { Party } from '../../data/schema/party'
import { DrawerField, DrawerGrid, DrawerMore } from './DrawerField'

/** What the user typed, read for what it looks like rather than asked about. */
export function fieldFor(typed: string): 'name' | 'mobile' | 'gstin' {
  const trimmed = typed.trim()
  if (/^\d{6,}$/.test(trimmed)) return 'mobile'
  if (/^[0-9]{2}[A-Za-z]{5}[0-9]{4}[A-Za-z]/.test(trimmed)) return 'gstin'
  return 'name'
}

const GROUPS = ['Sundry Debtors', 'Sundry Creditors']
const STATES = ['Madhya Pradesh', 'Uttarakhand', 'Delhi', 'Karnataka', 'Assam', 'Maharashtra']
const DEALERS = ['Registered', 'Composition', 'Unregistered']

const BLANK = {
  gstin: '', name: '', group: GROUPS[0]!, mobile: '', state: STATES[0]!, opening: '', openingSide: 'Dr',
  alias: '', printName: '', address: '', email: '', pin: '', dealer: DEALERS[0]!,
  creditDays: '', bank: '', ifsc: '',
}

type PartyDrawerProps = {
  typed: string | null
  onClose: () => void
  onCreated: (party: Party) => void
}

export function PartyDrawer({ typed, onClose, onCreated }: PartyDrawerProps) {
  const [draft, setDraft] = useState(BLANK)
  const [refused, setRefused] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const [creating, setCreating] = useState(false)
  const first = useRef<HTMLInputElement>(null)

  // Arrive with what was typed already in the right box, and the cursor in the first one.
  //
  // THE FOCUS IS DEFERRED A FRAME ON PURPOSE. The Drawer takes the keyboard onto its own panel
  // when it opens — it has to, or the panel is something you tab past — so anything wanting the
  // keyboard somewhere better has to ask after that has happened. Filling the draft and leaving
  // the focus alone put the cursor on the panel, and F2 then had nothing to create from.
  useEffect(() => {
    if (typed === null) return
    setDraft({ ...BLANK, [fieldFor(typed)]: typed.trim() })
    setChecked(false)
    setRefused(null)
    const frame = requestAnimationFrame(() => first.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [typed])

  const put = (key: keyof typeof draft) => (value: string) => setDraft((was) => ({ ...was, [key]: value }))

  async function create() {
    if (creating) return
    setCreating(true)
    // Nothing here decides whether the party is ALLOWED to exist — a name already taken, a
    // GSTIN nobody has checked. Those are the backend's, and a refusal comes back typed.
    const answer = await data.createParty({
      name: draft.name.trim(),
      mobile: draft.mobile.trim(),
      gstin: draft.gstin.trim(),
      city: draft.state,
      // The four the interface no longer accepts were removed on 21-08: trust grade, credit
      // limit, overdue and GSTIN status. The last one was being set to 'active' whenever the
      // box was not empty, which is a claim about somebody's tax compliance that no front end
      // can make. The credit-limit FIELD went with them on the same day rather than being left
      // to type into nothing — see the note on it below.
    })
    setCreating(false)
    if (isRefusal(answer)) {
      setRefused(answer.message)
      return
    }
    onCreated(answer)
  }

  return (
    <Drawer
      open={typed !== null}
      onClose={onClose}
      // "Party", not "Customer". v2 says Customer and its own Group field offers Sundry
      // Creditors two lines below — a title that contradicts a field under it reads as
      // carelessness, and this drawer genuinely creates both.
      title="Create Party"
      returnFocus={false}
      footer={
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-ink-secondary">F2 creates it</span>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={create} disabled={draft.name.trim() === '' || creating}>
              Save Party
            </Button>
          </div>
        </div>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void create()
        }}
        onKeyDown={(event) => {
          if (actionFor(event) !== 'create-record') return
          event.preventDefault()
          void create()
        }}
      >
        {refused === null ? null : (
          <p role="alert" className="mb-4 text-sm text-danger">
            {refused}
          </p>
        )}

        <DrawerGrid>
          <DrawerField label="GSTIN" value={draft.gstin} onChange={put('gstin')} placeholder="27AAECB2789K1ZR">
            {/* The badge appears only after a check has actually come back. In v2 it sits in
                the header at all times, which makes it decoration rather than an answer. */}
            <Button variant="ghost" size="sm" onClick={() => setChecked(draft.gstin.trim() !== '')}>
              Validate
            </Button>
          </DrawerField>
          <DrawerField label="Name" required value={draft.name} onChange={put('name')} inputRef={first} />
          <DrawerField label="Group" required value={draft.group} onChange={put('group')} options={GROUPS} />
          <DrawerField label="Mobile" value={draft.mobile} onChange={put('mobile')} />
          <DrawerField label="State" value={draft.state} onChange={put('state')} options={STATES} />
          <DrawerField label="Opening balance" value={draft.opening} onChange={put('opening')} align="end">
            <select
              value={draft.openingSide}
              onChange={(event) => put('openingSide')(event.target.value)}
              aria-label="Opening balance side"
              className="h-control rounded-control border border-stroke bg-surface px-2 text-body text-ink"
            >
              <option>Dr</option>
              <option>Cr</option>
            </select>
          </DrawerField>
        </DrawerGrid>

        {checked ? (
          <p className="mt-3 flex items-center gap-2 text-sm text-success">
            <Icon name="tick" className="size-icon-sm" />
            GSTIN checked
          </p>
        ) : null}

        <DrawerMore label="Expand to full master">
          <DrawerGrid>
            <DrawerField label="Alias" value={draft.alias} onChange={put('alias')} />
            <DrawerField label="Print name" value={draft.printName} onChange={put('printName')} />
            <DrawerField label="Address" wide value={draft.address} onChange={put('address')} />
            <DrawerField label="Email" value={draft.email} onChange={put('email')} />
            <DrawerField label="Pin code" value={draft.pin} onChange={put('pin')} />
            <DrawerField label="Type of dealer" value={draft.dealer} onChange={put('dealer')} options={DEALERS} />
            {/* THE CREDIT LIMIT IS NOT SET HERE, ruled 21-08. A limit is set by whoever
                controls credit, not by whoever happens to be billing at that moment — and this
                drawer exists to stop somebody leaving the invoice, not to be a full master
                form. The field also typed into nothing: `createParty` takes the four things a
                person types, because a party's standing is the backend's answer. */}
            <DrawerField label="Credit days" value={draft.creditDays} onChange={put('creditDays')} align="end" />
            <DrawerField label="Bank name" value={draft.bank} onChange={put('bank')} />
            <DrawerField label="IFSC code" value={draft.ifsc} onChange={put('ifsc')} />
          </DrawerGrid>
        </DrawerMore>
      </form>
    </Drawer>
  )
}
