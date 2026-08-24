// One of a short list of fixed answers, from a native <select>.
//
// FOUR SCREENS STYLED THEIR OWN, with four different class runs — the pager's rows-per-page, a
// settings row, the drawer's field, and the party drawer's Dr/Cr. Three of the four agreed by
// accident and the fourth had no focus ring at all, so a person on the keyboard could land on it
// and see nothing. That is the shape every duplicate takes here: right on the day it was written,
// wrong the day one of them gains something the others do not.
//
// IT STAYS NATIVE, AND THAT IS A DECISION RATHER THAN A SHORTCUT. A list of fixed answers is the
// one control where the platform's own is better than anything we would draw: it opens as the
// operating system's picker on a tablet, it is typeahead-searchable, it is reachable with no
// JavaScript, and every screen reader already knows what it is. `ComboBox` exists for the other
// case — a long list you have to search, with a create row and recents — and the two are not the
// same control wearing different clothes.
//
// WHY NOT A CHEVRON OF OUR OWN. The native control draws its own mark, and replacing it means
// hiding the real one with `appearance-none` and positioning ours over it, which loses the
// platform picker on touch. A mark we own is not worth that.

import type * as React from 'react'

import { cn } from './cn'

export type SelectOption = {
  value: string
  label: string
  /** Shown after the label, in the same option, for a choice that needs a word of explanation. */
  note?: string
}

export type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  /** The accessible name. Required unless something else on the screen already labels it and
   *  says so with `labelledBy` — a select with no name is a control nobody can be told about. */
  label?: string
  labelledBy?: string
  /** `sm` is the compact one, for a control sitting inside a strip rather than in a form. */
  size?: 'default' | 'sm'
  /** What the person chose is not a valid answer. It shows, and it says so to a screen reader —
   *  a red border alone is invisible to somebody who cannot see red. */
  invalid?: boolean
  disabled?: boolean
  /** Why it is off. Nothing is disabled here without saying why. */
  reason?: string
  /** Fills the space it is given, for a field in a form rather than a control in a strip. */
  fill?: boolean
  className?: string
}

export function Select({
  value,
  onChange,
  options,
  label,
  labelledBy,
  size = 'default',
  invalid = false,
  disabled = false,
  reason,
  fill = false,
  className,
}: SelectProps) {
  return (
    <select
      value={value}
      onChange={(event: React.ChangeEvent<HTMLSelectElement>) => onChange(event.target.value)}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      {...(label === undefined ? {} : { 'aria-label': label })}
      {...(labelledBy === undefined ? {} : { 'aria-labelledby': labelledBy })}
      {...(disabled && reason !== undefined ? { title: reason } : {})}
      className={cn(
        'rounded-control border bg-surface text-body text-ink focus-ring',
        size === 'sm' ? 'h-control-sm px-1' : 'h-control px-2',
        fill ? 'min-w-0 flex-1' : '',
        // The same treatment TextField uses for the same state: a soft fill rather than a
        // second stroke colour, so a field that is wrong reads as wrong at a glance and does not
        // need the border examined. `aria-invalid` above carries it to a screen reader.
        invalid ? 'border-stroke bg-danger-soft' : 'border-stroke',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.note === undefined ? option.label : `${option.label} — ${option.note}`}
        </option>
      ))}
    </select>
  )
}
