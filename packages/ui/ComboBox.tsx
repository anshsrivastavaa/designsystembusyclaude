// The plain ComboBox. It knows nothing about parties, items, stock or balances, and a check
// fails any use of it outside a named picker.
//
// It reports which row is HIGHLIGHTED — hovered for a mouse, arrowed-to for a keyboard — and
// hands that to the row renderer: the pickers differ in what a row CONTAINS, not how it looks.
// That is why it is hand-written rather than cmdk, which owns the highlight. DECISIONS, 19-08.

import * as React from 'react'

import { ComboBoxList } from './ComboBoxList'
import { useListOpening } from './listOpening'
import { nextStop, NOTHING, stopsOf } from './comboBoxStops'
import { TextField } from './TextField'

export type ComboBoxProps<Option> = {
  value: string
  onValueChange: (value: string) => void
  options: readonly Option[]
  getKey: (option: Option) => string
  renderRow: (option: Option, state: { highlighted: boolean }) => React.ReactNode
  onSelect: (option: Option) => void
  /** The user left without picking — Escape. */
  onDismiss?: () => void
  placeholder?: string
  label: string
  invalid?: boolean
  inputRef?: React.Ref<HTMLInputElement>
  listId: string
  /** Open the list the moment the field takes focus. True for a destination focused once, like
   * the party field; false where the keyboard walk passes through every row. */
  openOnFocus?: boolean
  /** A heading per option. Options must already be in group order. */
  groupOf?: (option: Option) => string | null
  /** A row pinned below the list, for "create a new one". The last stop the arrows reach. */
  stickyAction?: { label: string; onChoose: () => void }
  /** A row pinned above the list, for an action over the whole list. The first stop. */
  stickyLead?: { label: string; onChoose: () => void }
  /** A line pinned below the list that says something and does nothing — never a stop. */
  note?: string
  /** What the list hangs off, when the field sits inside a box. The party field sits in a box narrower than itself
   * and its input is wider, so a list anchored to the input did not line up with the thing a
   * person sees as the field. Left out, the input is the anchor. */
  anchorTo?: React.RefObject<HTMLElement | null>
  /** Focus has left the field. The caller decides whether that means anything. */
  onLeave?: () => void
}

function ComboBox<Option>({
  value,
  onValueChange,
  options,
  getKey,
  renderRow,
  onSelect,
  onDismiss,
  placeholder,
  anchorTo,
  label,
  invalid,
  inputRef,
  listId,
  openOnFocus = false,
  groupOf,
  stickyAction,
  stickyLead,
  note,
  onLeave,
}: ComboBoxProps<Option>) {
  // NOTHING, not the first row — see comboBoxStops.ts. Three rulings met to trap the party
  // field: the list opens on focus, the first row is highlighted, Tab picks the highlighted
  // row. All three are kept; opening BY ITSELF highlights nothing.
  const [highlight, setHighlight] = React.useState(NOTHING)
  const input = React.useRef<HTMLInputElement>(null)

  /** Has the user asked this list anything — typed, or arrowed inside it. */
  const asked = React.useRef(false)
  const list = React.useRef<HTMLDivElement>(null)

  // When it opens and when it goes away — see listOpening.ts, which records the three separate
  // ways those rules have collided with the rest of this codebase.
  const { open, ask, dismiss, arrived, left } = useListOpening(openOnFocus, input, list)




  // Where the arrows stop, worked out in comboBoxStops.ts. A pinned row above the options
  // shifts every one of them along by one, which is the off-by-one a test now owns.
  const { count: stops, onLeadRow, onStickyRow, optionIndex } = stopsOf(options.length, highlight, {
    hasLead: stickyLead !== undefined,
    hasSticky: stickyAction !== undefined,
  })
  // A note alone is worth showing: it answers what was typed, where a vanished list says nothing.
  const visible = open && (stops > 0 || note !== undefined)
  const current = optionIndex === -1 ? undefined : options[optionIndex]

  // The highlight drags the list along, or arrowing down stops dead at the last option in view.
  React.useEffect(() => {
    if (!visible || !current) return
    const row = document.getElementById(`${listId}-${getKey(current)}`)
    row?.scrollIntoView({ block: 'nearest' })
  }, [visible, current, listId, getKey])

  function choose() {
    dismiss()
    if (onLeadRow) stickyLead?.onChoose()
    else if (onStickyRow) stickyAction?.onChoose()
    else if (current) onSelect(current)
  }

  // A changed list must not leave the highlight on a row that has gone. Typing IS asking, so
  // the first match is highlighted; only an untouched list highlights nothing.
  React.useEffect(() => {
    setHighlight(asked.current ? 0 : NOTHING)
  }, [options])

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    // One rule, everywhere: list open, up and down move inside it; list closed, they belong to
    // whatever is around the field. Escape hands them back, Alt+Down opens deliberately. The
    // state of the list may never change what a key MEANS — the user cannot see that state
    // before they press it, and three rounds of arrow-key confusion came from trying.
    // NO `!visible` GUARD: that is the rule above being kept. DECISIONS, 25-08.
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault()
      event.stopPropagation()
      // Alt+Down is the user ASKING for the list, so the first stop is highlighted and one
      // Enter takes it. Only a list that opened BY ITSELF, on focus, highlights nothing —
      // that is the one nobody asked for.
      asked.current = true
      setHighlight(0)
      ask()
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (!visible) return
      event.preventDefault()
      event.stopPropagation()
      // Arrowing is asking, too.
      asked.current = true
      setHighlight((at) => nextStop(at, event.key === 'ArrowDown' ? 1 : -1, stops))
      return
    }

    if (event.key === 'Enter' && visible) {
      // A note-only list, or one nobody has asked anything of, has nothing to choose — so
      // Enter belongs to whatever is around the field.
      if (stops === 0 || highlight === NOTHING) {
        dismiss()
        return
      }
      // The grid also listens for Enter. Picking is what this Enter meant, so it stops here.
      event.preventDefault()
      event.stopPropagation()
      choose()
      return
    }

    // Tab picks what is highlighted and carries on out. Except when the pick OPENS something:
    // then that is where the keyboard is going, and moving on takes it straight back out.
    // Tab with nothing highlighted just leaves. That is the whole of the fix for the field
    // that could not be left without picking somebody.
    if (event.key === 'Tab' && visible && stops > 0 && highlight !== NOTHING) {
      if (onStickyRow || onLeadRow) event.preventDefault()
      choose()
      return
    }

    if (event.key === 'Escape' && visible) {
      event.preventDefault()
      event.stopPropagation()
      dismiss()
      onDismiss?.()
    }
  }

  return (
    <div className="relative h-full w-full">
      <TextField
        ref={(node: HTMLInputElement | null) => {
          input.current = node
          if (typeof inputRef === 'function') inputRef(node)
          else if (inputRef) (inputRef as React.RefObject<HTMLInputElement | null>).current = node
        }}
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={visible && current ? `${listId}-${getKey(current)}` : undefined}
        aria-label={label}
        invalid={invalid ?? false}
        placeholder={placeholder ?? ''}
        value={value}
        onChange={(event) => {
          // Typing is asking — for the list back, as well as for what is in it.
          asked.current = true
          onValueChange(event.target.value)
          ask()
        }}
        onKeyDown={handleKeyDown}
        // A CLICK ON A CLOSED FIELD OPENS IT, whether or not focus moves. Relying on focus
        // alone meant a field that already held the keyboard could not be reopened by clicking
        // it — and after the containment net has quietly returned focus here, that is exactly
        // the state the field is in.
        onPointerDown={() => {
          if (!openOnFocus) return
          ask()
        }}
        onFocus={() => {
          // Opened BY ITSELF: nothing is highlighted until the user arrows or types.
          asked.current = false
          setHighlight(NOTHING)
          arrived()
        }}
        onBlur={(event) => {
          // A GENUINE move away — Tab, or a click onto something that takes focus — makes the
          // next arrival a fresh one, so the list opens again. The containment net's rescue is
          // not a genuine move: it has no related target, and treating it as one is what made
          // a dismissed list reopen the instant it was dismissed.
          left(event.relatedTarget !== null)
          onLeave?.()
        }}
      />

      <ComboBoxList
        listId={listId}
        label={label}
        anchorRef={anchorTo ?? input}
        open={visible}
        onClose={dismiss}
        options={options}
        getKey={getKey}
        renderRow={renderRow}
        highlight={highlight}
        onStickyRow={onStickyRow}
        onHighlight={setHighlight}
        onChooseOption={(option) => {
          dismiss()
          onSelect(option)
        }}
        listRef={list}
        {...(groupOf ? { groupOf } : {})}
        {...(stickyAction ? { stickyAction: { ...stickyAction, onChoose: () => { dismiss(); stickyAction.onChoose() } } } : {})}
        {...(stickyLead ? { stickyLead: { ...stickyLead, onChoose: () => { dismiss(); stickyLead.onChoose() } } } : {})}
        {...(note === undefined ? {} : { note })}
      />
    </div>
  )
}

export { ComboBox }
