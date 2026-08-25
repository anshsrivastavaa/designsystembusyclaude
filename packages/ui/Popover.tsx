// A small surface anchored to the control that opened it. The invoice listing's date range,
// filters, table view, column setup and row kebab are all this one component.
//
// A LIVE BUG IN ComboBoxList TODAY, NOT A TIDY-UP FOR LATER. ComboBoxList always drops
// DOWNWARDS: it sets `top` to the field's bottom edge and never checks whether the list fits
// under it. So an item cell low on the screen opens its list off the bottom of the window,
// and the options are there, correct, and unreachable. That is on the create screen right
// now. This file already solves it — the flip below — so the fix is the move rather than a
// second patch.
//
// THE MOVE, when whoever owns that file wants it: ComboBoxList keeps the listbox roles and
// the row rendering, and hands the drawing and the placing to this file. Nothing else about
// it changes. It is the create session's file, so this note is the whole of what this session
// can do about it, and that session has been told the same.
//
// It has to happen either way: two components drawing an anchored surface through a portal is
// the duplication this codebase bans, and the next bug found in one will be fixed in one.
//
// WHAT THIS ADDS OVER ComboBoxList's placing, which is the reason it is not a copy:
//   • it flips above the anchor when there is no room below, instead of running off the
//     bottom of the window — a column-setup list opened from a toolbar low on the screen is
//     taller than the space under it
//   • it pulls back from the left and right edges instead of hanging off them
//   • it can align its right edge to the anchor's, for a control sitting at the right of a
//     row — a kebab's menu opening leftwards is the whole reason that alignment exists
//   • it holds the keyboard: focus goes in when it opens and back where it came from when it
//     closes, so a menu is not something you tab past on your way down the page
//
// It repositions on scroll rather than closing, unlike the ComboBox list. A toolbar button
// does not move when the table under it scrolls, and closing the date menu because somebody
// nudged the rows would read as the app losing its place.

import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from './cn'
import { placeAt, roomFor } from './popoverPlacement'

export type PopoverProps = {
  open: boolean
  onClose: () => void
  /** The control this hangs off. The caller owns it, and owns saying `aria-expanded` on it. */
  anchorRef: React.RefObject<HTMLElement | null>
  /** What the surface is, read out when the keyboard arrives inside it. */
  label: string
  /** `end` lines the panel's right edge up with the anchor's, for a control on the right. */
  align?: 'start' | 'end'
  /** Open at a POINT rather than under a control — where the pointer was, for a context menu.
   * The anchor is still given, because closing has to hand the keyboard back somewhere and a
   * point cannot take focus. */
  at?: { x: number; y: number }
  /** What the surface IS. A menu and a dialog take the keyboard; a `listbox` never does — the
   * field keeps it and points at the active row with `aria-activedescendant`, which is the whole
   * reason you can type and choose at the same time. */
  role?: 'dialog' | 'listbox'
  /** For the surface a field's `aria-controls` and `aria-activedescendant` point at. */
  id?: string
  /** Off for a listbox: moving focus into the panel would take it out of the field somebody is
   * still typing in. Everything else wants it, so it stays the default. */
  takesFocus?: boolean
  /** `anchor` makes the panel at least as wide as the control it hangs off, so a list under a
   * field lines up with the field rather than with whatever its own content wanted. */
  minWidth?: 'anchor'
  /** How much room the panel may take before it starts scrolling. `tall` is for a surface with
   * sections rather than a list of rows — the settlement panel, which reads as a keyhole at the
   * height a dropdown wants. It still never exceeds the window: the clamp below wins. */
  height?: 'default' | 'tall'
  /** The panel element, for a caller that has to scroll it or measure it. */
  panelRef?: React.RefObject<HTMLDivElement | null>
  children: React.ReactNode
}

// Geometry, not design values: the hair of space between a control and its surface, and how
// close to the window edge a panel may sit before it is pulled back.


export function Popover({
  open,
  onClose,
  anchorRef,
  label,
  align = 'start',
  at: point,
  role = 'dialog',
  id,
  takesFocus = true,
  minWidth,
  height = 'default',
  panelRef,
  children,
}: PopoverProps) {
  const own = React.useRef<HTMLDivElement>(null)
  const panel = panelRef ?? own
  const returnTo = React.useRef<HTMLElement | null>(null)
  const [at, setAt] = React.useState<{ left: number; top: number } | null>(null)

  // Placed in a layout effect, so the panel is measured and moved before the browser paints
  // and it is never seen in the wrong place first.
  React.useLayoutEffect(() => {
    if (!open) {
      setAt(null)
      return
    }

    const place = () => {
      const trigger = anchorRef.current
      const surface = panel.current
      if (!trigger || !surface) return

      // A point is a rectangle with no width or height, so everything below — the flip, the
      // clamp, the alignment — works on it unchanged rather than needing a second path.
      const anchor =
        point === undefined
          ? trigger.getBoundingClientRect()
          : ({ top: point.y, bottom: point.y, left: point.x, right: point.x } as DOMRect)

      // THE MINIMUM WIDTH IS WRITTEN BEFORE THE PANEL IS MEASURED, ON THE NODE, IN THIS PASS.
      //
      // It was React state, which meant the panel's size depended on the effect that measures the
      // panel — a feedback loop one render long. Measured on the running build: open the party
      // list at 1440 wide, then shrink the window to 560. The clamp ran with the panel's STALE
      // 490px width against the new 560px window, so `furthest` came out 62, the panel was pinned
      // at 62 while its field was at 109, and there it stayed — 47 pixels off its field and over
      // the rail. With a wider field, or a browser zoomed in, `furthest` goes negative and it
      // lands hard against EDGE, which is where Aj's screenshot has it.
      //
      // Writing it here costs nothing and removes the lag entirely: whatever the panel is about
      // to be, that is what gets measured.
      if (minWidth === 'anchor') surface.style.minWidth = `${anchor.width}px`

      // The ceiling, and then the window's own limit on top of it — a panel may ask for more room
      // than the screen has, and the screen wins.
      const seen = { width: window.innerWidth, height: window.innerHeight }
      surface.style.maxHeight = `${roomFor(height, seen)}px`
      const size = surface.getBoundingClientRect()

      // The flip, both clamps and the alignment are arithmetic and live in popoverPlacement.ts,
      // where they can be asked questions without a browser. Every fault this placement has had
      // was one of those four numbers.
      setAt(placeAt(anchor, size, seen, align))
    }

    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open, align, anchorRef, point, minWidth, height])

  // THE KEYBOARD, IN ITS OWN EFFECT, KEYED ONLY ON `open`. It was together with the listeners
  // below, whose dependencies include the caller's onClose — a new function on every render.
  // So every re-render while the panel was open ran the cleanup, which hands focus back to
  // the anchor, and the keyboard jumped out of the panel the moment anything above it
  // re-rendered. The test caught it as "expected false to be true" on the panel holding focus.
  React.useEffect(() => {
    if (!open) return

    if (!takesFocus) return

    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel.current?.focus()

    return () => {
      // Back where it came from — but the ANCHOR is the fallback, not the page body. Focus is
      // not always on the anchor when a panel opens: a programmatic open, or a keyboard
      // shortcut, leaves it on the body, and handing the keyboard back to the body strands
      // it. The control that opened the panel is always a sane place to be standing after it
      // shuts. The `isConnected` check is for the case where whatever opened the panel was
      // unmounted while it was open — focusing a detached element also drops the keyboard.
      const came = returnTo.current
      const back = came && came.isConnected && came !== document.body ? came : anchorRef.current
      if (back && back.isConnected) back.focus()
    }
  }, [open, anchorRef, takesFocus, panel])

  // DISMISSAL BELONGS TO WHOEVER OWNS THE KEYBOARD. A panel that takes focus is a surface in its
  // own right, and Escape and a click outside are how a person leaves it. A panel that does NOT
  // take focus is a view of somebody else's state — a listbox under a field — and the field is
  // still holding the keyboard, still handling Escape, and still deciding what leaving means.
  // Installing these as well gave the combo box two dismissal paths racing each other: Escape was
  // handled twice, and a pointerdown closed the list a frame before the field's own blur could
  // decide whether it should. Two journeys went red on it, in two different ways.
  React.useEffect(() => {
    if (!open || !takesFocus) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // Stopped here, or Escape carries on to whatever is behind and closes that too.
      event.stopPropagation()
      onClose()
    }

    // Pointer DOWN, not click: a click that starts outside and ends inside would otherwise
    // close the panel out from under the thing being clicked.
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panel.current?.contains(target)) return
      // The anchor is not "outside". Without this, clicking the button that opened the panel
      // closes it here and reopens it in the caller's handler, so it never appears to shut.
      if (anchorRef.current?.contains(target)) return
      onClose()
    }

    document.addEventListener('keydown', onKeyDown, true)
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.removeEventListener('pointerdown', onPointerDown, true)
    }
  }, [open, onClose, anchorRef, takesFocus, panel])

  if (!open) return null

  return createPortal(
    <div
      ref={panel}
      // A stable handle that does not move when `role` does. Anything looking for the panel by
      // its role finds a different element depending on what the panel IS, which is fine until
      // the thing being tested is the role itself.
      data-slot="popover"
      role={role}
      aria-label={label}
      {...(id === undefined ? {} : { id })}
      tabIndex={takesFocus ? -1 : undefined}
      // Hidden for the one commit before it has been measured and placed, so it is never
      // seen at the top-left corner first. HIDDEN BY OPACITY, NOT BY `visibility` — a
      // visibility:hidden element cannot take focus, so the keyboard silently failed to go
      // into the panel and the test read it as "expected false to be true". Opacity leaves
      // the element focusable, which is the whole difference.
      style={{
        ...(at === null ? { left: 0, top: 0, opacity: 0, pointerEvents: 'none' as const } : { left: at.left, top: at.top }),
      }}
      className={cn(
        'fixed z-50 flex flex-col overflow-hidden outline-none',
        'rounded-control border border-stroke bg-surface-raised shadow-popover',
      )}
    >
      {children}
    </div>,
    document.body,
  )
}
