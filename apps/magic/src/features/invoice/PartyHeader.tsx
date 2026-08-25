// Region three, minimal for the demo: enough to pick a party and see who the invoice is for.
// The party drawer and the rest of the product document's header content are a later pass.

import { useEffect, useRef, useState } from 'react'

import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import type { Party } from '../../data/schema/party'
import { PartyDetails } from './PartyDetails'
import { FieldSettings } from './FieldSettings'
import { PartyDrawer } from './PartyDrawer'
import { FieldBox } from './FieldBox'
import { PartyBadge } from './PartyBadge'
import { HeaderFields } from './HeaderFields'
import { PartyPicker } from './PartyPicker'
import { useInvoice } from './store'

/** WHAT THE PARTY FIELD DOES THE MOMENT SOMEBODY IS PICKED, which is the one thing about this
 * field a person sets. It is the settings drawer's own "on party select, confirm GSTIN and
 * address", offered where the decision is made rather than only four screens away — the same
 * relationship every other label on this row has to its own setting. */
const PARTY_ON_PICK = [
  { id: 'straight', label: 'Go straight to the items' },
  { id: 'confirm', label: 'Confirm GSTIN and address first' },
] as const

export function PartyHeader({ onOpenTransport, onOpenSettings }: { onOpenTransport: () => void; onOpenSettings: () => void }) {
  // Local until the shell offers it: the settings drawer carries the same switch, and wiring a
  // second writer to one setting is the fault this codebase keeps catching. What this popover
  // proves today is the DOOR — that the fourth label opens like the other three.
  const [confirmOnPick, setConfirmOnPick] = useState(false)
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

  // THE FIELD FOLLOWS THE STORE WHEN THE PARTY GOES AWAY, and this is the fault that made a
  // working Hold look broken. The text in this field is the search box's own — it has to be,
  // because somebody halfway through typing a name has no party yet — and nothing ever put it
  // back when the invoice was cleared UNDERNEATH it. Holding an invoice reported "Put aside for
  // Shah Enterprises", emptied the grid and zeroed the total, and left the name sitting in the
  // field: a control saying the invoice still had a party when the store said it had none.
  //
  // It never showed on the paths anybody tested because those REMOUNT the screen — Back, then
  // New — and a remount starts this state empty. Hold, Save & new and Discard all clear the
  // invoice in place, and there are three of them now.
  //
  // ON THE TRANSITION, NOT ON THE VALUE. An effect watching `party === null` would wipe the name
  // out from under anybody typing one, because there is no party until they pick.
  useEffect(
    () =>
      useInvoice.subscribe((state, before) => {
        if (before.party !== null && state.party === null) setSearch('')
      }),
    [],
  )
  const [options, setOptions] = useState<readonly Party[]>([])
  const [recentIds, setRecentIds] = useState<readonly string[]>([])
  const [showing, setShowing] = useState(false)
  // WHATEVER OPENED THE PANEL, so closing can hand the keyboard back to it. The grade badge is
  // the only door today — the Details control beside the party line went with the line — and
  // this is kept a ref rather than dropped because the panel is opened from a screen that will
  // grow a second way in.
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
      {/* AS WIDE AS v2's PARTY FIELD, WHICH IS 537 AT 1440 — AND NOT AS WIDE AS THE ROW.
          It was flex-1 and measured 756. v2 leaves the space between the party field and the
          invoice number empty on purpose; a field's width is a promise about what goes in it,
          and three quarters of a header row promises a party name nobody has. w-134 is 536,
          which is the nearest stop on the scale. It still SHRINKS on a narrow window — the
          fixed width is a ceiling, not a floor. */}
      <div className="w-134 min-w-0">
        {/* Above the field, not below it: the list opens over anything underneath, and a
            message the person cannot see is the same as no message.
            ABSENT, NOT EMPTY, WHEN THERE IS NOTHING WRONG. The row was always drawn and held
            nothing, and an empty baseline box is not quite zero high. Measured after: all three
            bordered field boxes now sit at exactly the same top, height and bottom. */}
        {asking?.field === 'party' ? (
          <p role="alert" className="text-right text-sm text-danger">
            {asking.message}
          </p>
        ) : null}
        {/* RELATIVE, AND IT IS THE FIELD'S OWN BOX. The notch is absolutely placed against its
            nearest positioned ancestor, and that used to be the row holding the label and the
            error — which sits ABOVE the field. So the party label rode four pixels higher than
            the other three: measured at 97 against 101 with everything else identical. A label whose
            job is to break a stroke has to be anchored to the box that draws the stroke. */}
        <FieldBox className="group/party mt-1">
          {/* THE SAME NOTCH THE OTHER THREE WEAR, AND NOW THE SAME DOOR BEHIND IT (Aj, 25-08).
              It was a bare `FieldLabel` while Inv No, Date and Due were all `FieldSettings` — so
              three labels on one row opened something and the fourth did nothing, which reads as
              the fourth being broken rather than as it having nothing to offer.
              THE CHOICES ARE WHAT THE PARTY FIELD DOES WHEN SOMEBODY IS PICKED, which is the only
              thing about this field a person sets. Both are switches in the settings drawer's
              Party zone, so the foot of this popover leads to the same place they live. */}
          <FieldSettings
            choices={PARTY_ON_PICK}
            chosen={confirmOnPick ? 'confirm' : 'straight'}
            onChoose={(id) => setConfirmOnPick(id === 'confirm')}
            onOpenSettings={onOpenSettings}
          >
            Party
          </FieldSettings>
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
        </FieldBox>

        {/* NOTHING UNDER THE PARTY FIELD, AND NO INSIGHT INFORMATION OUTSIDE THE DRAWER AT ALL.
            Ruled by Aj on 23-08 and confirmed twice on 24-08, the second time in those words.
            The city, the outstanding balance and a Details control used to sit here as v2's
            third header row; the whole line goes, not just the control.
            IT IS A RULE ABOUT WHERE A FACT LIVES, not about this one line — so a later pass
            that wants to show the credit limit, the overdue count or the GSTIN standing here
            is breaking it, however small the thing it wants to show.
            THE TRUST FACTOR IS THE DOOR. It is a real button inside the field and therefore
            reached by Tab, which was the other half of the 23-08 finding and is why deleting
            the Details control loses no way in. */}
      </div>

      {/* THE SPACE GOES BETWEEN THEM, WHICH IS v2's ARRANGEMENT. The party field used to fill
          the row, so the number, date and due sat against the right edge as a side effect of
          it. Fixing the party field's width took that away and left the four fields huddled
          on the left with the void after them — and the void is the wrong side, because the
          paperclip above and the grid's last column below are both hard against the right. */}
      <span className="flex-1" />

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
