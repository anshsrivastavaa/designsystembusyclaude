// What the keyboard does, read straight out of the one table that decides it.
//
// IT IS GENERATED, NOT TYPED OUT. A printed list of shortcuts kept by hand is wrong the first
// time somebody changes a binding and does not think to come here, and then it is worse than
// nothing — a person who trusts it and finds it lying stops trusting the rest of the help.
// This maps over `boundKeys`, so a shortcut that exists appears here and one that does not
// cannot.
//
// It is also where the night-mode button's reason is repeated, because somebody who pressed a
// disabled control and wondered why goes looking for help, not for a tooltip they already
// failed to get.

import * as React from 'react'

import { actionFor, boundKeys, type Action, type Where } from '../lib/shortcuts'
import { TopMenu } from './TopMenu'
import { isTyping } from '../lib/typing'

/** What each action is, in the words somebody would use for it. Here rather than in the table
 * because the table decides which key means which action, and has no business knowing English. */
const SAYS: Record<Action, string> = {
  'complete-row': 'Finish this row and start the next',
  'next-field': 'Next field',
  'previous-field': 'Previous field',
  'move-left': 'Move left',
  'move-right': 'Move right',
  'move-up': 'Move up',
  'move-down': 'Move down',
  'last-filled-row': 'Go to the last row with something on it',
  'first-row': 'Go to the first row',
  'last-row': 'Go to the last row',
  'create-record': 'Create the record you are looking at',
  'open-record': 'Open the invoice you are on',
  'select-record': 'Pick the invoice you are on, without opening it',
  'new-document': 'New invoice',
  find: 'Search',
  clear: 'Clear the search, or close what is open',
  'show-help': 'Show these shortcuts',
  'next-section': 'Done with this part — go to the next one, and finish on the last',
}

const GROUPS: { where: Where; title: string }[] = [
  { where: 'global', title: 'Anywhere' },
  { where: 'list', title: 'In a listing' },
  { where: 'grid', title: 'In the item grid' },
]

const PRINTED: Record<string, string> = {
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ' ': 'Space', Escape: 'Esc',
}

function Keys({ bound }: { bound: (typeof boundKeys)[number] }) {
  const parts = [bound.command ? 'Ctrl' : null, bound.shift ? 'Shift' : null, PRINTED[bound.key] ?? bound.key]
  return (
    <span className="flex shrink-0 items-center gap-1">
      {parts.filter(Boolean).map((part) => (
        <kbd key={part} className="rounded-control border border-stroke bg-surface-sunken px-2 py-0.5 text-sm text-ink-secondary">
          {part}
        </kbd>
      ))}
    </span>
  )
}

export function HelpMenu() {
  const [open, setOpen] = React.useState(false)

  // "?" from anywhere, as long as nothing is being typed into — which the shortcut table
  // cannot know, so the screen decides it and the table still decides what the key MEANS.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const typing = isTyping(event.target)
      if (typing) return
      if (actionFor(event, 'global') !== 'show-help') return
      event.preventDefault()
      setOpen((was) => !was)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      {/* THE WORD, NOT A QUESTION MARK, AND THERE IS ONLY ONE OF IT. v2 has a Help dropdown in
          the left group with no contents at all, and this build had a `?` icon on the right
          holding the real thing. Two controls answering to the same name is the duplicate
          definition problem arriving as user interface — whichever one somebody learns, the
          other is a dead end. So v2's empty one is folded into this, and this takes v2's
          position and v2's word. The shortcut is still `?`, which the title says.

          IT IS TopMenu, NOT A SECOND ONE. This file used to carry its own trigger and its own
          Popover, and the className was byte-identical to TopMenu's — which is how the drift
          gate found it. The only thing it needed that TopMenu lacked was to be opened from
          outside, by the `?` key, so TopMenu takes an optional `open` and this passes it. */}
      <TopMenu label="Help" title="Help and keyboard shortcuts  ( ? )" open={open} onOpenChange={setOpen}>
        <div className="min-h-0 overflow-auto p-3">
          {GROUPS.map((group) => {
            const rows = boundKeys.filter((bound) => bound.where === group.where)
            if (rows.length === 0) return null
            return (
              <section key={group.where} className="mb-3 last:mb-0">
                <h3 className="mb-1 text-sm font-label text-ink-muted">{group.title}</h3>
                {rows.map((bound) => (
                  <div key={`${bound.key}-${bound.command}-${bound.shift}`} className="flex items-center justify-between gap-6 py-1 text-body">
                    <span className="text-ink">{SAYS[bound.action]}</span>
                    <Keys bound={bound} />
                  </div>
                ))}
              </section>
            )
          })}

          <p className="border-t border-stroke pt-2 text-sm text-ink-secondary">
            Night mode is not built yet — the dark theme is the step after this one, which is
            why its button is switched off rather than doing nothing.
          </p>
        </div>
      </TopMenu>
    </>
  )
}
