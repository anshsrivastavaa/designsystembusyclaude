// Which columns are on, as a list of ticks in a popover.
//
// A POPOVER RATHER THAN A DRAWER: it is a list of ticks, and a whole panel sliding in from the
// side to tick a box is chrome the task does not deserve.
//
// GROUPED, because the list is eighteen long once the document's full set is in it, and
// eighteen ticks in one column is a list nobody reads to the end.
//
// IN packages/ui BECAUSE BOTH TABLES NEED IT. The listing has it and the item grid has column
// customise pending; under one component that arrives already built. What differs between them
// is which columns exist, what they are grouped under and which cannot be turned off — all of
// which is data, handed in. What does NOT differ is the shape of the list, and that is the part
// that would otherwise be written twice.
//
// ONE COMPONENT, ONE NAMED WRAPPER PER FEATURE, which is already the rule for ComboBox and
// already gated. A generic list dropped straight onto a screen is how several slightly
// different column pickers appear.
//
// NO EXPLANATORY SUBTEXT. This carried a line reading "without them a row is money belonging to
// nobody", which is a sentence explaining a design decision to somebody who did not ask.
// Nothing else in the product talks to the user like that. The padlocks already say it.

import type * as React from 'react'

import { Checkbox } from './Checkbox'
import { Icon } from './Icon'
import { Popover } from './Popover'

export type ColumnListItem = {
  id: string
  header: string
  group: string
  /** Always shown. It keeps its place and says why, rather than vanishing from the list. */
  locked?: boolean
  /** Asked for by the product document and answerable by no field the record carries. Shown and
   * switched off, saying what it waits on — omitting them would make a third of the list look
   * like the whole of it. */
  waitingOn?: string
  /** Frozen, and where in the stack against that edge. Drawn only when there is a stack to have
   * a position in: "left" alone is the whole answer for one column, and "1 of 1" is noise. */
  pinnedAt?: { side: 'left' | 'right'; place: number; of: number }
}

export type ColumnListProps = {
  open: boolean
  onClose: () => void
  anchorRef: React.RefObject<HTMLElement | null>
  /** Where the right-click was, when it came from one. */
  at?: { x: number; y: number }
  /** In the order the groups should appear. A group with nothing in it is not drawn. */
  groups: readonly string[]
  items: ColumnListItem[]
  hidden: readonly string[]
  onToggle: (id: string) => void
  /** Offered only when something is pinned: a permanently disabled control teaches people to
   * ignore it. */
  onUnpinAll?: () => void
}

export function ColumnList({
  open, onClose, anchorRef, at, groups, items, hidden, onToggle, onUnpinAll,
}: ColumnListProps) {
  const anyPinned = items.some((item) => item.pinnedAt !== undefined)

  return (
    <Popover open={open} onClose={onClose} anchorRef={anchorRef} label="Column setup" {...(at ? { at } : {})}>
      <div className="max-h-96 w-64 overflow-auto py-1">
        {groups.map((group) => {
          const inGroup = items.filter((item) => item.group === group)
          if (inGroup.length === 0) return null

          return (
            <section key={group}>
              <h3 className="px-3 pt-2 pb-1 text-sm font-label text-ink-muted">{group}</h3>

              {inGroup.map((item) => {
                const off = item.waitingOn !== undefined
                const fixed = item.locked === true
                return (
                  <label
                    key={item.id}
                    {...(off ? { title: `Needs ${item.waitingOn}` } : {})}
                    className={
                      fixed || off
                        ? 'flex items-center gap-3 px-3 py-1 text-body text-ink-muted'
                        : 'flex items-center gap-3 px-3 py-1 text-body text-ink hover:bg-surface-hover'
                    }
                  >
                    <Checkbox
                      checked={!off && (fixed || !hidden.includes(item.id))}
                      disabled={fixed || off}
                      onChange={() => onToggle(item.id)}
                      aria-label={
                        off ? `${item.header} — needs ${item.waitingOn}` : fixed ? `${item.header} — always shown` : item.header
                      }
                    />
                    <span className="flex-1 truncate">{item.header}</span>

                    {item.pinnedAt === undefined ? null : (
                      <span
                        className="shrink-0 text-sm text-ink-muted"
                        aria-label={`Pinned ${item.pinnedAt.of > 1 ? `${item.pinnedAt.side} ${item.pinnedAt.place}` : item.pinnedAt.side}`}
                      >
                        ← {item.pinnedAt.of > 1 ? `${item.pinnedAt.side} ${item.pinnedAt.place}` : item.pinnedAt.side}
                      </span>
                    )}

                    {fixed ? <Icon name="lock" className="size-icon-sm" role="img" aria-label="Always shown" /> : null}
                  </label>
                )
              })}
            </section>
          )
        })}

        {anyPinned && onUnpinAll ? (
          <div className="mt-1 border-t border-stroke pt-1">
            <button
              type="button"
              onClick={onUnpinAll}
              className="w-full px-3 py-1.5 text-left text-body text-ink hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none"
            >
              Unpin all
            </button>
          </div>
        ) : null}
      </div>
    </Popover>
  )
}
