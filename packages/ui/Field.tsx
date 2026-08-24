// A label, a control, and the one line that says what is wrong with it.
//
// One layout for all three, because the gap between a label and its control is a decision and
// it was being made four times. The control itself is passed in: this owns the ARRANGEMENT and
// nothing about what is being typed into.
//
// THE LABEL SITS ON THE FIELD'S TOP EDGE, NOT ABOVE IT. v2's arrangement, approved by Aj on
// 23-08 as the rule for every field on the product: the label straddles the border with the
// surface colour behind it, so the box appears to break around the word. It is not a floating
// placeholder — it never sits inside the field and never moves when you type. What it buys is
// vertical room: a stacked label and control is two rows of height for one field, and the
// invoice header carries four of them in a strip that also has to hold a party name.
//
// SLIGHTLY MORE AIR THAN v2, which is the one change from it — Aj's words were "just increase
// the margin a bit but keep that format". v2 pads the word by one step; this pads by one and a
// half, and gives the control a hair more left inset so the text does not start under the label.
//
// IT NEEDS A POSITIONED PARENT AND OWNS ONE. `relative` lives here rather than on the caller,
// because a label positioned against whatever ancestor happens to be relative is a label that
// lands somewhere different on every screen that uses it.
//
// THE MESSAGE SLOT IS ALWAYS THERE WHEN ASKED FOR. A message that appears from nothing pushes
// the control up as you type, which moves the thing under the pointer at the moment somebody
// is reaching for it. `reservesMessage` keeps the room; the words arrive into it.

import type * as React from 'react'

import { cn } from './cn'
import { Label, type LabelProps } from './Label'

export type FieldProps = {
  label: React.ReactNode
  children: React.ReactNode
  /** What is wrong. Announced, so it reaches somebody who cannot see it turn red. */
  message?: string
  /** Hold the message's line even while there is no message. */
  reservesMessage?: boolean
  className?: string
} & Pick<LabelProps, 'onOpenSettings' | 'settingsName'>

export function Field({
  label,
  children,
  message,
  reservesMessage = false,
  className,
  onOpenSettings,
  settingsName,
}: FieldProps) {
  return (
    <div className={cn('relative min-w-0 pt-2', className)}>
      {/* z above the control, so the word is never under the field's own border or its focus
          ring. The surface colour behind it is what breaks the border round it — which means a
          field on a sunken panel needs the panel's colour passed in, not this one's. */}
      <span className="pointer-events-auto absolute top-2 left-2 z-10 -translate-y-1/2 bg-surface px-1.5">
        <Label
          {...(onOpenSettings ? { onOpenSettings } : {})}
          {...(settingsName ? { settingsName } : {})}
        >
          {label}
        </Label>
      </span>

      <div>{children}</div>

      {message === undefined && !reservesMessage ? null : (
        <p role={message === undefined ? undefined : 'alert'} className="mt-1 min-h-5 text-sm text-danger">
          {message}
        </p>
      )}
    </div>
  )
}
