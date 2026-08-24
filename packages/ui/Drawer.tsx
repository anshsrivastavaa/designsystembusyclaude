// One Drawer in the product. Every drawer is this component with a different body — party
// details, transporter, settings. There is never a second one.
//
// Built here because party details is its first real use, and not before: a component built
// ahead of a screen gets a shape nobody asked for.
//
// What it owns: the wash behind it, the panel, the escape key, the click outside, and putting
// the keyboard inside while it is open and back where it came from when it closes. What it
// does not own is anything about parties.

import * as React from 'react'
import { createPortal } from 'react-dom'

import { cn } from './cn'

export type DrawerProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Put the keyboard back where it came from on close. True unless the caller is going to
   * place it deliberately — after creating a party the cursor belongs in the first item cell,
   * not back in the field that opened the drawer. */
  returnFocus?: boolean
}

export function Drawer({ open, onClose, title, children, footer, returnFocus = true }: DrawerProps) {
  const panel = React.useRef<HTMLDivElement>(null)
  const returnTo = React.useRef<HTMLElement | null>(null)
  // Read at cleanup time, not captured when the drawer opened. As a dependency it would make
  // the effect tear down and set up again the moment the answer changed, and that teardown is
  // itself a hand-back — the very thing the flag exists to prevent.
  const wantsItBack = React.useRef(returnFocus)
  wantsItBack.current = returnFocus

  // LAYOUT, not a passive effect. A passive effect's cleanup runs after the browser has
  // painted, so between the drawer's contents leaving the page and the keyboard being handed
  // back there was a frame with focus on the page body — the containment net caught it, and
  // the fuzz found it on press 141 pressing Escape inside the new-party drawer. Handing the
  // keyboard back is part of closing, not something that happens to the screen afterwards.
  React.useLayoutEffect(() => {
    if (!open) return

    // Remember where the keyboard was, so closing puts it back rather than dropping it on the
    // page body — which is how a grid stops responding after a dialog.
    returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    panel.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKeyDown, true)

    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      // Only if it is still there. Whatever opened the drawer may have been unmounted while
      // it was open, and focusing a detached element puts the keyboard on the page body.
      if (!wantsItBack.current) return
      const back = returnTo.current
      if (back && back.isConnected) back.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        // The wash. Clicking it closes, and it is not a button: a screen reader is told about
        // the drawer, and the way out by keyboard is Escape.
        aria-hidden="true"
        onMouseDown={onClose}
        className="absolute inset-0 bg-scrim"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={cn(
          'relative flex h-full w-drawer flex-col bg-surface-raised shadow-drawer outline-none',
          'border-l border-stroke',
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-stroke px-6 py-4">
          <h2 className="text-lg font-strong text-ink">{title}</h2>
        </header>

        <div className="min-h-0 flex-1 overflow-auto px-6 py-4">{children}</div>

        {footer ? <footer className="shrink-0 border-t border-stroke px-6 py-4">{footer}</footer> : null}
      </div>
    </div>,
    document.body,
  )
}
