// Every state a TextField can be in, at both densities.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { TextField } from './TextField'

function Cell({ children }: { children: React.ReactNode }) {
  return <div className="h-control w-48 overflow-hidden rounded-control border border-stroke">{children}</div>
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-stroke py-4 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-ink-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function Density({ density, label }: { density: string; label: string }) {
  const [typed, setTyped] = useState('Steel rod 12mm')

  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>
      <div className="mt-2 rounded-card border border-stroke bg-surface px-5">
        <Row label="Empty">
          <Cell>
            <TextField placeholder="Search items…" aria-label="Item" />
          </Cell>
        </Row>
        <Row label="Holding a value">
          <Cell>
            <TextField value={typed} onChange={(event) => setTyped(event.target.value)} aria-label="Item" />
          </Cell>
        </Row>
        <Row label="A number, right aligned">
          <Cell>
            <TextField defaultValue="1250.00" align="end" aria-label="Price" />
          </Cell>
        </Row>
        <Row label="Invalid">
          <Cell>
            <TextField defaultValue="-4" invalid align="end" aria-label="Quantity" />
          </Cell>
        </Row>
        <Row label="Locked">
          <Cell>
            <TextField value="As per party master" locked readOnly aria-label="Price" />
          </Cell>
        </Row>
        <Row label="Too much text">
          <Cell>
            <TextField defaultValue="Galvanised steel reinforcement rod, 12mm, bundle of fifty" aria-label="Item" />
          </Cell>
        </Row>
      </div>
    </section>
  )
}

function TextFieldPage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">TextField</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          The field a grid cell is edited in. Invalid fills the cell, so the screen says which
          field is wrong rather than which row. Locked sinks it and takes the text cursor away,
          while leaving the value fully readable — a locked value is real and still matters.
        </p>
        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />
      </div>
    </main>
  )
}

const meta = { title: 'TextField', render: () => <TextFieldPage /> } satisfies Meta

export default meta

export const TextField_: StoryObj<typeof meta> = { name: 'TextField' }
