// The furniture the catalogue pages are built out of — a labelled row, and the shell a table
// demo sits in. Not product components: nothing here ever renders in the application.
//
// IT LIVES HERE RATHER THAN IN packages/ui because packages/ui is the design system, and a
// thing in it is a thing the product team may reach for. A demo row is scaffolding for the
// showroom, not stock on the shelf. Storybook's own folder is where Storybook's own support
// belongs.
//
// WHY IT EXISTS AT ALL: `Row` was written out five times, in five story files, in two slightly
// different shapes — one aligning to the centre and one to the top, one carrying a note and one
// not. The drift gate found them as byte-identical class strings across files, which is the same
// fault as five party pickers arriving by a quieter route. Two shapes, one component, one prop.

import type * as React from 'react'

export function DemoRow({
  label,
  note,
  align = 'center',
  children,
}: {
  label: string
  note?: string
  /** `top` where the demo is taller than one line — a stack of controls, a note underneath. */
  align?: 'center' | 'top'
  children: React.ReactNode
}) {
  return (
    <div
      className={`flex gap-4 border-b border-stroke py-4 last:border-b-0 ${
        align === 'top' ? 'items-start' : 'items-center'
      }`}
    >
      <span className="w-40 shrink-0 text-sm text-ink-secondary">{label}</span>
      {align === 'top' ? (
        <div>
          {children}
          {note === undefined ? null : <p className="mt-2 text-sm text-ink-muted">{note}</p>}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">{children}</div>
      )}
    </div>
  )
}

/** The shell a table demo sits in, so three table pages stop each drawing their own. */
export function DemoTable({ children }: { children: React.ReactNode }) {
  return <table className="w-full rounded-card border border-stroke bg-surface text-body">{children}</table>
}
