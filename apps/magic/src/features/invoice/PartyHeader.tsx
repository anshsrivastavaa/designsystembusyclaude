// Region three, minimal for the demo: enough to pick a party and see who the invoice is for.
// The party drawer and the rest of the product document's header content are a later pass.

import { useEffect, useRef, useState } from 'react'

import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { formatBalancePaise } from '../../lib/money'
import type { Party } from '../../data/schema/party'
import { PartyDetails } from './PartyDetails'
import { PartyDrawer } from './PartyDrawer'
import { Button } from '@busy/ui/Button'
import { Label } from '@busy/ui/Label'
import { PartyBadge } from './PartyBadge'
import { HeaderFields } from './HeaderFields'
import { InEffect } from './InEffect'
import { PartyPicker } from './PartyPicker'
import { useInvoice } from './store'

/** The one line under the party field. Outstanding first, because that is what the person
 * asking "can I sell to them" is looking for; overdue only when there is some. */
function partyLine(party: Party): string {
  const parts = [party.city, `Outstanding ${formatBalancePaise(party.outstandingPaise)}`]
  if (party.overduePaise > 0) parts.push(`${formatBalancePaise(party.overduePaise)} overdue`)
  return parts.filter((part) => part !== '').join(' · ')
}

export function PartyHeader({ onOpenTransport, onOpenSettings }: { onOpenTransport: () => void; onOpenSettings: () => void }) {
  const party = useInvoice((state) => state.party)
  const chooseParty = useInvoice((state) => state.chooseParty)
  const moveTo = useInvoice((state) => state.moveTo)
  const asking = useInvoice((state) => state.asking)
  const field = useRef<HTMLInputElement>(null)

  // An invoice begins here: you cannot save without a party, so this is where the keyboard
  // starts and the list is already open when it arrives.
  useEffect(() => {
    field.current?.focus()
  }, [])

  // The error arrives with the cursor. Being told what is wrong and then having to find it is
  // most of the work of being told.
  //
  // THE CURSOR MOVES WHEN THE ASK IS MADE, NOT WHEN THE SCREEN NEXT RENDERS. Watching `asking`
  // through a render meant the move happened a beat after the keypress that caused it, and in
  // that beat the keyboard sat on the page body — pressing Save with no party had to be
  // rescued by the containment net, on the 100th press of the fuzz. Subscribing to the store
  // puts the focus inside the same click that raised the error.
  useEffect(
    () =>
      useInvoice.subscribe((state, before) => {
        if (state.asking === before.asking) return
        if (state.asking?.field === 'party') field.current?.focus()
      }),
    [],
  )
  const [search, setSearch] = useState('')
  const [options, setOptions] = useState<readonly Party[]>([])
  const [recentIds, setRecentIds] = useState<readonly string[]>([])
  const [showing, setShowing] = useState(false)
  // WHICHEVER CONTROL OPENED THE PANEL, so closing can hand the keyboard back to it. Two things
  // open it — the grade badge and the Details control — and the screen is the only thing that
  // knows which was pressed.
  //
  // THE SCREEN DOES THIS, NOT THE DRAWER, and the reason is a race that only showed once the
  // panel started loading its facts. The Drawer returns the keyboard on its way out, and the
  // invoice's containment net puts a lost keyboard back on the first control it can find — and
  // with a full panel to unmount, the net's keyup check ran first and landed on Back. A slower
  // panel is not a reason for the cursor to end up somewhere else, so the hand-off is made here
  // where it can be immediate. The party drawer next door already works this way.
  const openedBy = useRef<HTMLElement | null>(null)
  const openPanel = () => {
    openedBy.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setShowing(true)
  }
  const [creating, setCreating] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    // Recent first, then everything the search found, with the recent ones not repeated.
    // Cash sits in Recent when it genuinely is recent, and scrolls away when it is not.
    void Promise.all([data.listRecentParties(), data.listParties(search)]).then(([recentAnswer, foundAnswer]) => {
      if (!current) return
      const recent = isRefusal(recentAnswer) ? [] : recentAnswer
      const found = isRefusal(foundAnswer) ? [] : foundAnswer
      const matched = new Set(found.map((candidate) => candidate.id))
      const recentMatches = recent.filter((candidate) => matched.has(candidate.id))
      const recentSet = new Set(recentMatches.map((candidate) => candidate.id))
      setRecentIds(recentMatches.map((candidate) => candidate.id))
      setOptions([...recentMatches, ...found.filter((candidate) => !recentSet.has(candidate.id))])
    })
    return () => {
      current = false
    }
  }, [search])

  return (
    <section aria-label="Party" className="flex shrink-0 items-end gap-4 px-2 pt-2">
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-4">
          <Label className="text-caps uppercase tracking-wide">Party</Label>
          {/* Above the field, not below it: the list opens over anything underneath, and a
              message the person cannot see is the same as no message. */}
          {asking?.field === 'party' ? (
            <p role="alert" className="text-sm text-danger">
              {asking.message}
            </p>
          ) : null}
        </div>
        <div className="group/party mt-1 flex h-control items-center rounded-control border border-stroke bg-surface">
          <PartyPicker
            listId="party-list"
            value={search}
            onValueChange={setSearch}
            options={options}
            recentIds={recentIds}
            onSelect={(chosen) => {
              setSearch(chosen.name)
              chooseParty(chosen)
              // Picking a party is the end of this step and the beginning of the next one.
              // The invoice's whole purpose is the lines, so the cursor goes to the first
              // item cell rather than staying here with nothing left to do.
              moveTo({ row: 0, column: 'item' })
            }}
            onCreate={() => setCreating(search)}
            // Leaving the field with something the search could not find is what opens the
            // drawer — Tab, Enter or clicking away. Nobody has to find a button.
            onLeaveUnmatched={() => {
              if (search.trim() !== '' && options.length === 0 && party === null) setCreating(search)
            }}
            inputRef={field}
            invalid={asking?.field === 'party'}
          />
          <PartyBadge party={party} onOpen={openPanel} />
        </div>

        {/* WHAT IS KNOWN ABOUT THIS PARTY, DOCKED UNDER THE FIELD — v2's third header row, and
            the same partner the settings labels have: a line that appears only when there is
            something to say. It was a block to the right of the field, which put the party's
            standing further from the party's name than the invoice number was. */}
        {party === null ? null : (
          <div className="flex items-baseline gap-3">
            <InEffect>{partyLine(party)}</InEffect>
            {/* v2 keeps the readout as TEXT and puts a named control beside it. The line was
                itself a button here, which made a paragraph of facts look pressable and gave
                the one thing you can actually do no name of its own. */}
            <Button variant="ghost" size="sm" onClick={openPanel} className="shrink-0">
              Details
            </Button>
          </div>
        )}
      </div>

      <HeaderFields onOpenTransport={onOpenTransport} onOpenSettings={onOpenSettings} />

      <PartyDetails
        party={showing ? party : null}
        onClose={() => {
          setShowing(false)
          openedBy.current?.focus()
        }}
      />

      <PartyDrawer
        typed={creating}
        // CLOSING WITHOUT CREATING PUTS THE KEYBOARD BACK IN THE PARTY FIELD, and it is this
        // screen that decides that rather than the Drawer. The Drawer returns the keyboard to
        // whatever opened it, and declines when that element has gone — which it had: the fuzz
        // reached the drawer from a row's delete control, the rows re-rendered underneath, and
        // closing left the keyboard on the page body. A drawer cannot know where a screen
        // wants the cursor; this screen does. The party field is where you were, and it is
        // where the invoice begins.
        onClose={() => {
          setCreating(null)
          field.current?.focus()
        }}
        onCreated={(created) => {
          setCreating(null)
          setSearch(created.name)
          chooseParty(created)
          moveTo({ row: 0, column: 'item' })
        }}
      />
    </section>
  )
}
