// The field a grid cell is edited in, and the field a form uses later. It carries no label:
// in a grid the column header is the label, and in a form the label is a separate thing that
// can sit above or beside.
//
// Two states live here rather than on the row, and both are deliberate. INVALID fills the
// cell, so the screen says which field is wrong rather than which row is. LOCKED sinks the
// cell and takes the text cursor away — a locked value is real and still matters, so it stays
// fully legible, which is why it is not the same treatment as disabled.

import * as React from 'react'

import { cn } from './cn'

// React 19 takes `ref` as an ordinary prop, so there is no forwardRef here and no second
// name wrapping the first.
type TextFieldProps = Omit<React.ComponentProps<'input'>, 'size'> & {
  invalid?: boolean
  locked?: boolean
  align?: 'start' | 'end'
}

function TextField({ className, invalid = false, locked = false, align = 'start', ...props }: TextFieldProps) {
  return (
    <input
      data-slot="text-field"
      readOnly={locked}
      aria-invalid={invalid || undefined}
      // A locked field is not disabled: it is still readable and still reachable by keyboard,
      // it simply cannot be typed into.
      className={cn(
        'h-full w-full bg-transparent px-2 text-body text-ink outline-none',
        'placeholder:text-ink-muted',
        align === 'end' && 'text-right',
        invalid && 'bg-danger-soft',
        locked && 'cursor-default bg-surface-sunken text-ink-secondary',
        className,
      )}
      {...props}
    />
  )
}

export { TextField }
