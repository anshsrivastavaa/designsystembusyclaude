// The list a ComboBox drops. Its own file because it is its own thing: the field owns the
// typing and the keyboard, this owns where the list is drawn and what a row looks like.
//
// IT SITS ON THE POPOVER NOW, AND THAT FIXED TWO THINGS PEOPLE COULD SEE. This file used to
// measure the field and place itself against the window, which was the same job Popover already
// did for everything else — two anchored surfaces in one codebase, and the second one carried
// the bugs. A list opened low in the window ran off the bottom and the rows past the fold could
// not be reached at all, because this one never learned to flip; Popover has flipped and clamped
// on both axes since it was written. And the panel took the INPUT's width, so under a 224px
// field box a 280px list hung out to one side; it takes the anchor's width as a MINIMUM now, so
// it lines up with whatever it hangs off and still grows for its own content.
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

import { cn } from './cn'
import { Popover } from './Popover'

export type ComboBoxListProps<Option> = {
  listId: string
  label: string
  /** The control the list hangs off. Pass the field's BOX where there is one — the list lines up
   *  with what a person sees as the field, not with the bare input inside it. */
  anchorRef: React.RefObject<HTMLElement | null>
  open: boolean
  onClose: () => void
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
  anchorRef,
  open,
  onClose,
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
  // A ROW IS ONLY HOVERED ONCE THE POINTER HAS MOVED. Opening a panel under a pointer that has
  // not moved fires `mouseenter` on whatever row happens to land beneath it, and that reads as a
  // deliberate hover — so the highlight the keyboard just set is thrown away by a mouse nobody
  // touched.
  //
  // It went unnoticed while the list could only open DOWNWARDS: the field is above the list, so
  // the pointer that clicked the field was never over a row. The moment Popover's flip arrived,
  // a field low in the window put the list ABOVE it and the pointer landed on the LAST row —
  // Alt+Down set the first stop, the phantom hover moved it to the ninth, and Enter added the
  // wrong charge. That was read as a timing failure in the move and cost the 24-08 attempt.
  const [pointerMoved, setPointerMoved] = React.useState(false)
  React.useEffect(() => {
    if (!open) setPointerMoved(false)
  }, [open])
  const hover = (index: number) => {
    if (pointerMoved) onHighlight(index)
  }

  // Every stop above the options shifts them along, so the arrows and the mouse agree about
  // which row is which. One number, worked out once.
  const offset = stickyLead ? 1 : 0
  const onLeadRow = stickyLead !== undefined && highlight === 0

  return (
    <Popover
      open={open}
      onClose={onClose}
      anchorRef={anchorRef}
      label={label}
      role="listbox"
      id={listId}
      // The field keeps the keyboard. Moving focus into the panel would take it out of the input
      // somebody is still typing in, which is the whole reason a listbox is pointed at with
      // `aria-activedescendant` rather than entered.
      takesFocus={false}
      minWidth="anchor"
      panelRef={listRef}
    >
      <div className="contents" onPointerMove={() => setPointerMoved(true)}>
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
          onMouseEnter={() => hover(0)}
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
                onMouseEnter={() => hover(index + offset)}
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
          onMouseEnter={() => hover(options.length + offset)}
          onMouseDown={(event) => {
            event.preventDefault()
            stickyAction.onChoose()
          }}
        >
          {stickyAction.label}
        </div>
      ) : null}
      </div>
    </Popover>
  )
}
