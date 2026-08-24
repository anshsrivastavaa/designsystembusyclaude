// Invoice settings. The largest surface in the product and the one most likely to become a
// scroll nobody reads, which is what the search box and the zone tabs are for.
//
// NO CANCEL, AND NO SAVE. A setting takes effect the moment it changes — that is already this
// codebase's ruling and it is why there is no Save button. A Cancel beside it would promise an
// undo that does not exist, which is worse than no button at all. One Done, and it closes.
//
// THE ORDER IS THE SCREEN'S ORDER, not the alphabet's: header and numbering, party, item table,
// tax, sundries, totals. You find a setting by remembering where the thing it controls sits.
//
// A HEADING ONLY APPEARS WHEN SOMETHING IS UNDER IT. In a filtered list several sections have
// nothing left in them, and a title with nothing beneath it is a promise the list does not keep.
//
// THE ZONE TABS WRAP TO TWO LINES AT 1280 AND THAT IS FINE — DO NOT "FIX" IT. Seven chips is
// one more than fits, and the obvious saving is dropping "All", which costs the full-map view.
// The map is worth more than the line: a settings drawer is read, not scanned, and somebody who
// cannot see the whole shape has to guess which section a thing is in. It will wrap harder at
// 125% zoom on Windows and that is still fine.
//
// IT LIVES BESIDE THE INVOICE, NOT IN THE SHELL. It opened from a gear in the top bar for a
// day, on the argument that its contents cross both screens. They do not: the series, the tax
// mode and the round off are the invoice's, and v2 opens this from the invoice's own header.
// A gear in the chrome also made every screen advertise a drawer that only one of them can act
// on. Moved here rather than left in app/ because a feature may not import from app/ — that is
// the application depending on its own features and its features depending back on it.
//
// WHICH SWITCHES ACTUALLY REACH THE INVOICE, checked rather than assumed, because the note here
// said "nothing is wired" for a day after it had been. `lib/invoiceSettingsFrom.ts` is the join,
// and everything it maps changes the screen the moment it moves: the tax mode, Prices include
// tax, Round off, round-each-line and the HSN summary. Everything else in this catalogue writes
// to the store and is read by nothing — and every one of those is marked `parked`, so the
// drawer says so on the switch rather than looking live. If a switch here is neither mapped nor
// parked, that is the bug.

import * as React from 'react'

import { Drawer } from '@busy/ui/Drawer'
import { Icon } from '@busy/ui/Icon'
import { Select } from '@busy/ui/Select'
import { TextField } from '@busy/ui/TextField'
import { Toggle } from '@busy/ui/Toggle'
import { ZONES, type Setting, type Zone } from './settingsCatalogue'
import { groupsIn, visibleSettings, zonesWithSomething } from './settingsSearch'
import { useSettings } from './settingsStore'

function Row({ setting }: { setting: Setting }) {
  const values = useSettings((state) => state.values)
  const set = useSettings((state) => state.set)

  if (setting.kind === 'note') {
    return <p className="py-2 text-sm text-ink-secondary">{setting.label}</p>
  }

  if (setting.kind === 'switch') {
    // Parked: named by the product document, behaviour undefined. Shown, off, saying so —
    // guessing would be worse than an obvious blank and leaving it out reads as finished.
    return (
      <div className="flex items-start justify-between gap-6 py-2">
        <span className="min-w-0">
          <span className={setting.parked === undefined ? 'text-body text-ink' : 'text-body text-ink-muted'}>
            {setting.label}
          </span>
          {setting.note === undefined ? null : <span className="block text-sm text-ink-secondary">{setting.note}</span>}
          {setting.parked === undefined ? null : (
            <span className="block text-sm text-ink-muted">Parked — {setting.parked}</span>
          )}
        </span>
        <Toggle
          checked={values[setting.id] === true}
          disabled={setting.parked !== undefined}
          onCheckedChange={(next) => set(setting.id, next)}
        >
          <span className="sr-only">{setting.label}</span>
        </Toggle>
      </div>
    )
  }

  // A parked CHOICE has to look parked too. It only looked it on switches for a day, so a
  // dropdown nothing reads sat there as live as the ones that work.
  return (
    <label className="flex flex-col gap-1 py-2">
      <span className={setting.parked === undefined ? 'text-body text-ink' : 'text-body text-ink-muted'}>
        {setting.label}
      </span>
      {setting.note === undefined ? null : <span className="text-sm text-ink-secondary">{setting.note}</span>}
      {setting.parked === undefined ? null : (
        <span className="text-sm text-ink-muted">Parked — {setting.parked}</span>
      )}
      <Select
        label={setting.label}
        value={String(values[setting.id] ?? '')}
        disabled={setting.parked !== undefined}
        {...(setting.parked === undefined ? {} : { reason: setting.parked })}
        onChange={(next) => set(setting.id, next)}
        options={setting.options.map((option) => ({
          value: option.value,
          label: option.label,
          ...(option.note === undefined ? {} : { note: option.note }),
        }))}
      />
    </label>
  )
}

export function Settings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [zone, setZone] = React.useState<Zone | 'all'>('all')
  const [query, setQuery] = React.useState('')

  // Searching asks about the whole drawer, so it beats the zone. Emptying the box puts the zone
  // back in charge — WITHOUT that, clearing a search silently throws away the section somebody
  // chose and the list jumps to five times its length under their hands.
  const visible = visibleSettings(query.trim() === '' ? zone : 'all', query)
  const searching = query.trim() !== ''
  const live = zonesWithSomething(visible)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Invoice settings"
      footer={
        // One button. There is nothing to save because everything is already applied, and
        // nothing to cancel because there is no undo behind it.
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-control rounded-control bg-accent px-4 text-body font-label text-on-accent hover:bg-accent-hover focus-ring"
          >
            Done
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex h-control items-center gap-1 rounded-control border border-stroke bg-surface px-2 focus-ring-within">
          <Icon name="search" className="text-ink-muted" />
          <TextField
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search settings — try “paise” or “series”"
            aria-label="Search settings"
          />
        </div>

        {/* A section is a CHOICE rather than a heading lost in a long scroll. Hidden while
            searching, because search already looks everywhere and a tab that no longer narrows
            anything is a control reporting a state it is not in. */}
        {searching ? null : (
          <div role="radiogroup" aria-label="Setting sections" className="flex flex-wrap gap-1">
            {[{ id: 'all' as const, label: 'All' }, ...ZONES].map((option) => (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={zone === option.id}
                onClick={() => setZone(option.id)}
                className={
                  zone === option.id
                    ? 'h-control-sm rounded-control bg-surface-selected px-3 text-body font-label text-ink-accent'
                    : 'h-control-sm rounded-control px-3 text-body text-ink-secondary hover:bg-surface-hover hover:text-ink'
                }
              >
                {option.label}
              </button>
            ))}
          </div>
        )}

        {visible.length === 0 ? (
          <p className="py-8 text-center text-body text-ink-secondary">
            Nothing matches “{query.trim()}”. Try another word, or clear the search to see the whole list.
          </p>
        ) : (
          ZONES.filter((one) => live.has(one.id)).map((one) => (
            <section key={one.id}>
              <h3 className="border-b border-stroke pb-1 text-sm font-label text-ink-muted">{one.label}</h3>
              {groupsIn(visible, one.id).map(([group, settings]) => (
                <div key={group || one.id} className="divide-y divide-stroke">
                  {group === '' ? null : <h4 className="pt-3 text-sm text-ink-secondary">{group}</h4>}
                  {settings.map((setting) => (
                    <Row key={setting.id} setting={setting} />
                  ))}
                </div>
              ))}
            </section>
          ))
        )}
      </div>
    </Drawer>
  )
}
