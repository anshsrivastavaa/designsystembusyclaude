// Every state a Checkbox can be in, including the one that is easy to skip: mixed. A header
// tick over a part-selected page is neither on nor off, and the story exists so somebody can
// see that it looks like neither.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './Checkbox'

const ROWS = ['4/2026-27', '6/2026-27', '3/2026-27', '2/2026-27']

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-stroke py-3 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-ink-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

/** The header tick and its rows, wired together, because mixed only makes sense in company. */
function SelectAll() {
  const [picked, setPicked] = useState<string[]>([ROWS[0]!])
  const all = picked.length === ROWS.length
  const some = picked.length > 0 && !all

  return (
    <div className="rounded-card border border-stroke bg-surface">
      <label className="flex h-row items-center gap-3 border-b border-stroke px-4 text-sm font-label text-ink">
        <Checkbox
          checked={all}
          mixed={some}
          onChange={() => setPicked(all || some ? [] : [...ROWS])}
          aria-label="Select every invoice on this page"
        />
        {picked.length === 0 ? 'Select all' : `${picked.length} selected`}
      </label>
      {ROWS.map((row) => (
        <label
          key={row}
          className="flex h-row items-center gap-3 border-b border-stroke px-4 text-sm text-ink last:border-b-0 hover:bg-surface-hover"
        >
          <Checkbox
            checked={picked.includes(row)}
            onChange={(event) =>
              setPicked((was) => (event.target.checked ? [...was, row] : was.filter((one) => one !== row)))
            }
            aria-label={`Select ${row}`}
          />
          {row}
        </label>
      ))}
    </div>
  )
}

function Density({ density, label }: { density: string; label: string }) {
  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>
      <div className="mt-2 rounded-card border border-stroke bg-surface px-5">
        <Row label="Off">
          <Checkbox aria-label="Off" onChange={() => {}} />
        </Row>
        <Row label="On">
          <Checkbox checked aria-label="On" onChange={() => {}} />
        </Row>
        <Row label="Mixed">
          <Checkbox mixed aria-label="Mixed" onChange={() => {}} />
        </Row>
        <Row label="Disabled, off">
          <Checkbox disabled aria-label="Disabled and off" onChange={() => {}} />
        </Row>
        <Row label="Disabled, on">
          <Checkbox disabled checked aria-label="Disabled and on" onChange={() => {}} />
        </Row>
        <Row label="In a row of its own">
          <div className="w-72">
            <SelectAll />
          </div>
        </Row>
      </div>
    </section>
  )
}

function CheckboxPage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Checkbox</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          A real browser checkbox with our colour on it. The tick does not grow with density —
          the row it sits in does, and the whole cell is the target. Mixed is a state of its
          own: tick one row below and watch the header tick refuse to claim it is on.
        </p>
        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />
      </div>
    </main>
  )
}

const meta = { title: 'Checkbox', render: () => <CheckboxPage /> } satisfies Meta

export default meta

export const Checkbox_: StoryObj<typeof meta> = { name: 'Checkbox' }
