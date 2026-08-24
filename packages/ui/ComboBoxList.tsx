// The list a ComboBox drops. Its own file because it is its own thing: the field owns the
// typing and the keyboard, this owns where the list is drawn and what a row looks like.
//
// OWED: THIS SITS ON THE POPOVER, IT DOES NOT LIVE BESIDE IT. The listing session is building
// one Popover primitive, and the anchoring below — measure the field, place a panel against
// the window, close on scroll and resize — is the same job. Two anchored surfaces in one
// codebase is exactly the duplication this repo exists to prevent, so when Popover lands this
// file keeps the rows and the foot and hands the placing over. It is owed at a natural break
// in region two, not as an interruption; see the note in the Popover file.
//
// It is drawn against the window rather than inside the page's own structure. It has to be:
// inside a grid cell it sits in a box 33 pixels tall with its overflow hidden, so every pixel
// of it would be clipped away — present, correct, and invisible.
//
// The panel scrolls in the middle and has a FOOT. The foot is flush to the panel's bottom
// edge and full width, and the scrolling part is clipped to end where the foot begins, so
// nothing ever shows underneath it. It read as a bar floating over the list before that,
// because rows could be seen above and below it.

import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from './cn'

export type ComboBoxListProps<Option> = {
  listId: string
  label: string
  anchor: { left: number; top: number; width: number } | null
  options: readonly Option[]
  getKey: (option: Option) => string
  renderRow: (option: Option, state: { highlighted: boolean }) => React.ReactNode
  highlight: number
  onStickyRow: boolean
  /** A row pinned ABOVE the list, for an action that applies to the whole list rather than to
   * one row of it — "add the charges this party had last time". It is the FIRST stop the
   * arrows reach, because it is the first thing on the screen. */
  stickyLead?: { label: string; onChoose: () => void }
  onHighlight: (index: number) => void
  onChooseOption: (option: Option) => void
  listRef: React.RefObject<HTMLDivElement | null>
  groupOf?: (option: Option) => string | null
  stickyAction?: { label: string; onChoose: () => void }
  note?: string
}

export function ComboBoxList<Option>({
  listId,
  label,
  anchor,
  options,
  getKey,
  renderRow,
  highlight,
  onStickyRow,
  stickyLead,
  onHighlight,
  onChooseOption,
  listRef,
  groupOf,
  stickyAction,
  note,
}: ComboBoxListProps<Option>) {
  if (anchor === null) return null

  // Every stop above the options shifts them along, so the arrows and the mouse agree about
  // which row is which. One number, worked out once.
  const offset = stickyLead ? 1 : 0
  const onLeadRow = stickyLead !== undefined && highlight === 0

  return createPortal(
    <div
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={label}
      style={{ left: anchor.left, top: anchor.top, width: anchor.width }}
      className={cn(
        // Tall enough to show that there is a list. Two-line rows in a 16rem panel showed
        // four, which reads as the whole thing rather than the top of it.
        'fixed z-50 flex max-h-96 flex-col overflow-hidden',
        'rounded-control border border-stroke bg-surface-raised shadow-popover',
      )}
    >
      {stickyLead ? (
        <div
          id={`${listId}-lead`}
          role="option"
          aria-selected={onLeadRow}
          className={cn(
            'shrink-0 cursor-default border-b border-stroke px-3 py-2',
            'text-body font-label text-ink-accent',
            onLeadRow ? 'bg-surface-hover' : 'bg-surface-raised',
          )}
          onMouseEnter={() => onHighlight(0)}
          onMouseDown={(event) => {
            event.preventDefault()
            stickyLead.onChoose()
          }}
        >
          {stickyLead.label}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto py-1">
        {options.map((option, index) => {
          const highlighted = !onStickyRow && !onLeadRow && index + offset === Math.min(highlight, options.length - 1 + offset)
          const heading = groupOf?.(option) ?? null
          const opensGroup = heading !== null && (index === 0 || groupOf?.(options[index - 1]!) !== heading)
          return (
            <React.Fragment key={getKey(option)}>
              {opensGroup ? (
                <div
                  role="presentation"
                  // A LINE TO SIT ON. The label alone floated and read as a stray word rather
                  // than the top of a group — v2 draws a hairline under "Recent" and "All
                  // parties" for exactly this. The rule is taken rather than the pixel: a
                  // group heading needs an edge, and the edge is our stroke token.
                  //
                  // The first group's heading has no rule above it, so the line under it is
                  // the only thing needed; every later one gets a little more room above so
                  // the two groups do not read as one list with a line through it.
                  className="mx-3 border-b border-stroke pt-3 pb-1 text-sm font-label text-ink-muted first:pt-2"
                >
                  {heading}
                </div>
              ) : null}
              <div
                id={`${listId}-${getKey(option)}`}
                role="option"
                aria-selected={highlighted}
                className={cn('cursor-default px-3 py-2 text-body', highlighted && 'bg-surface-hover')}
                onMouseEnter={() => onHighlight(index + offset)}
                onMouseDown={(event) => {
                  // Down rather than click: blur would close the list before a click landed.
                  event.preventDefault()
                  onChooseOption(option)
                }}
              >
                {renderRow(option, { highlighted })}
              </div>
            </React.Fragment>
          )
        })}
      </div>

      {note === undefined ? null : (
        <div role="presentation" className="shrink-0 border-t border-stroke px-3 py-2 text-body text-ink-secondary">
          {note}
        </div>
      )}

      {stickyAction ? (
        <div
          id={`${listId}-sticky`}
          role="option"
          aria-selected={onStickyRow}
          className={cn(
            'shrink-0 cursor-default border-t border-stroke px-3 py-2',
            'text-body font-label text-ink-accent',
            onStickyRow ? 'bg-surface-hover' : 'bg-surface-raised',
          )}
          onMouseEnter={() => onHighlight(options.length + offset)}
          onMouseDown={(event) => {
            event.preventDefault()
            stickyAction.onChoose()
          }}
        >
          {stickyAction.label}
        </div>
      ) : null}
    </div>,
    document.body,
  )
}
