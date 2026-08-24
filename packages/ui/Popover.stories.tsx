// The four surfaces the invoice listing actually opens, so the story shows the component
// doing its real job rather than holding the word "content".
//
// The two worth pushing on: the panel at the bottom of the page flips above its button
// instead of running off the window, and the one on the right lines its right edge up with
// its button instead of hanging off the edge.

import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { Checkbox } from './Checkbox'
import { cn } from './cn'
import { Popover } from './Popover'

const RANGES = [
  ['Today', '20-08-2026'],
  ['Yesterday', '19-08-2026'],
  ['Last 7 days', '14-08-2026 – 20-08-2026'],
  ['Last 30 days', '22-07-2026 – 20-08-2026'],
  ['This month', '01-08-2026 – 31-08-2026'],
  ['This quarter', '01-07-2026 – 30-09-2026'],
  ['Current FY', '01-04-2026 – 31-03-2027'],
  ['All time', 'Every invoice in the book'],
]

const COLUMNS = [
  ['Date', true], ['Invoice No.', true], ['Party Name', true], ['Invoice Amount', false],
  ['Pending Amount', false], ['Due Date', false], ['Status', false], ['Party GSTIN', false],
  ['Party Phone Number', false], ['Party Email', false], ['Place of Supply', false],
  ['Payment Terms', false], ['Taxable Amount', false], ['Total Tax Amount', false],
] as const

/** A button and the surface it opens, wired the way a caller is meant to wire them. */
function Opens({ label, align, children }: { label: string; align?: 'start' | 'end'; children: React.ReactNode }) {
  const button = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button ref={button} variant="ghost" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((was) => !was)}>
        {label}
      </Button>
      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label={label} {...(align ? { align } : {})}>
        {children}
      </Popover>
    </>
  )
}

function Menu({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-0 flex-col overflow-auto py-1">{children}</div>
}

function Item({ children, chosen }: { children: React.ReactNode; chosen?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between gap-6 px-3 py-2 text-left text-body',
        'hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none',
        chosen === true ? 'font-label text-ink-accent' : 'text-ink',
      )}
    >
      {children}
    </button>
  )
}

function DateRange() {
  return (
    <Menu>
      {RANGES.map(([name, dates]) => (
        <Item key={name} chosen={name === 'Current FY'}>
          {name}
          <span className="text-sm text-ink-muted">{dates}</span>
        </Item>
      ))}
      <div className="border-t border-stroke px-3 py-2 text-sm text-ink-secondary">Custom range…</div>
    </Menu>
  )
}

function ColumnSetup() {
  return (
    <Menu>
      {COLUMNS.map(([name, locked]) => (
        <label key={name} className="flex items-center gap-3 px-3 py-2 text-body text-ink hover:bg-surface-hover">
          <Checkbox checked disabled={locked} onChange={() => {}} aria-label={name} />
          {name}
          {locked ? <span className="ml-auto text-sm text-ink-muted">Always on</span> : null}
        </label>
      ))}
    </Menu>
  )
}

function Kebab() {
  return (
    <Menu>
      {['Print', 'Download PDF', 'Share', 'Duplicate', 'Receive Payment', 'Send Reminder', 'Cancel', 'Delete'].map(
        (name) => (
          <Item key={name}>{name}</Item>
        ),
      )}
    </Menu>
  )
}

function PopoverPage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-title font-strong tracking-tight">Popover</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          A surface anchored to the control that opened it. Escape closes it, so does clicking
          away, and the keyboard goes in when it opens and comes back out where it started.
        </p>

        <section className="mt-8 rounded-card border border-stroke bg-surface p-5">
          <h2 className="text-lg font-strong">Where they open from</h2>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Opens label="Current FY">
              <DateRange />
            </Opens>
            <Opens label="Column setup">
              <ColumnSetup />
            </Opens>
          </div>
        </section>

        <section className="mt-8 rounded-card border border-stroke bg-surface p-5">
          <h2 className="text-lg font-strong">Aligned to the right edge</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            A kebab sits at the right of its row, so its menu opens leftwards rather than off
            the side of the window.
          </p>
          <div className="mt-3 flex justify-end">
            <Opens label="⋮ Row actions" align="end">
              <Kebab />
            </Opens>
          </div>
        </section>

        <div className="h-96" />

        <section className="mb-8 rounded-card border border-stroke bg-surface p-5">
          <h2 className="text-lg font-strong">No room below</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Scroll so this button is near the bottom of the window, then open it. The panel
            flips above rather than running off the edge.
          </p>
          <div className="mt-3">
            <Opens label="Column setup">
              <ColumnSetup />
            </Opens>
          </div>
        </section>
      </div>
    </main>
  )
}

const meta = { title: 'Popover', render: () => <PopoverPage /> } satisfies Meta

export default meta

export const Popover_: StoryObj<typeof meta> = { name: 'Popover' }
