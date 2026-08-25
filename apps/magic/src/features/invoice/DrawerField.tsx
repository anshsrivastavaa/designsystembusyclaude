// The parts a master drawer is made of: the two-column grid, one cell of it, and the fold that
// opens the rest of the master.
//
// IT SITS ON packages/ui's Field RATHER THAN REPEATING IT. The first version of this file drew
// its own label above its own control, which is exactly what Field was written for — and Field
// landed in the same hour from the other session. Two treatments for the words beside a control
// is the duplication both of us are meant to be preventing, so this owns only what Field does
// not: which column a cell takes, whether the control is a box or a list, and what sits beside
// it. Everything about the LABEL is Field's.
//
// ONE SET, USED BY BOTH DRAWERS. Party and Item are the same shape — six fields, a fold, nine
// more — and written twice they would drift within a fortnight.
//
// IT IS NOT A PRIMITIVE. It knows a master drawer has fields in two columns, which is this
// feature's shape rather than the product's, so it lives beside the two drawers that use it.

import type * as React from 'react'

import { Field } from '@busy/ui/Field'
import { Select } from '@busy/ui/Select'
import { TextField } from '@busy/ui/TextField'
import { Icon } from '@busy/ui/Icon'
import { cn } from '@busy/ui/cn'

export function DrawerGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-3">{children}</div>
}

export type DrawerFieldProps = {
  label: string
  value: string
  onChange: (value: string) => void
  /** Marked with a star AND refused on save. A star that does not stop anything is decoration. */
  required?: boolean
  /** Spans both columns. For the things that are long — an address, an item description. */
  wide?: boolean
  placeholder?: string
  align?: 'start' | 'end'
  /** A fixed set turns the field into a select. The same label, the same box, one control. */
  options?: string[]
  inputRef?: React.Ref<HTMLInputElement>
  /** Something beside the field: a Validate button, a Dr/Cr side. */
  children?: React.ReactNode
}

export function DrawerField({
  label, value, onChange, required = false, wide = false, placeholder, align, options, inputRef, children,
}: DrawerFieldProps) {
  return (
    <Field
      className={cn(wide && 'col-span-2')}
      label={
        <>
          {label}
          {required ? <span className="text-danger"> *</span> : null}
        </>
      }
    >
      <span className="flex items-center gap-2">
        {options === undefined ? (
          <span className="h-control min-w-0 flex-1 rounded-control border border-stroke">
            <TextField
              ref={inputRef}
              value={value}
              onChange={(event) => onChange(event.target.value)}
              aria-label={label}
              {...(placeholder === undefined ? {} : { placeholder })}
              {...(align === undefined ? {} : { align })}
            />
          </span>
        ) : (
          <Select
            value={value}
            onChange={onChange}
            label={label}
            fill
            options={options.map((option) => ({ value: option, label: option }))}
          />
        )}
        {children}
      </span>
    </Field>
  )
}

/** The fold. Shut by default, because six fields is the interruption people agreed to and
 * fifteen is a form they abandon — and open in one press, because the master does have to be
 * fillable from here or it gets filled in later by somebody with none of the context. */
export function DrawerMore({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <details className="mt-5 border-t border-stroke pt-4">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-body font-label text-ink-accent">
        <Icon name="chevronDown" className="size-icon-sm" />
        {label}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}
