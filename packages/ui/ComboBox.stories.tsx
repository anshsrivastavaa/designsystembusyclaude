// The plain ComboBox with two different row shapes, which is the whole argument for wrappers
// rather than a setting: the rows differ in what they CONTAIN, not in how they look.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { ComboBox } from './ComboBox'

type Party = { id: string; name: string; balance: string }
type Thing = { id: string; name: string; stock: number }

const PARTIES: Party[] = [
  { id: 'p1', name: 'Sharma Traders', balance: '12,400.00' },
  { id: 'p2', name: 'Shah Enterprises', balance: '(3,200.00)' },
  { id: 'p3', name: 'Shreeji Hardware', balance: '0.00' },
]

const THINGS: Thing[] = [
  { id: 't1', name: 'Steel rod 12mm', stock: 420 },
  { id: 't2', name: 'Steel rod 16mm', stock: 0 },
  { id: 't3', name: 'Steel wire 8mm', stock: 96 },
]

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-label text-ink">{title}</h3>
      <div className="mt-2 h-control w-72 rounded-control border border-stroke bg-surface">{children}</div>
    </div>
  )
}

function ComboBoxPage() {
  const [party, setParty] = useState('Sh')
  const [thing, setThing] = useState('Steel')

  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">ComboBox</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          One component, two row shapes. Type, then use the up and down arrows: the highlighted
          row is handed to whoever draws the row, which is how a picker can show something on
          that row alone. Enter picks, Escape closes.
        </p>

        <section data-density="standard" className="mt-8">
          <h2 className="text-lg font-strong text-ink">Standard</h2>

          <Panel title="A row that carries a balance">
            <ComboBox
              label="Party"
              listId="party-list"
              placeholder="Search parties…"
              value={party}
              onValueChange={setParty}
              options={PARTIES.filter((option) => option.name.toLowerCase().includes(party.toLowerCase()))}
              getKey={(option) => option.id}
              onSelect={(option) => setParty(option.name)}
              renderRow={(option) => (
                <span className="flex items-baseline justify-between gap-4">
                  <span>{option.name}</span>
                  <span className="text-sm text-ink-secondary">{option.balance}</span>
                </span>
              )}
            />
          </Panel>

          <Panel title="A row that shows stock, on the highlighted row only">
            <ComboBox
              label="Item"
              listId="thing-list"
              placeholder="Search items…"
              value={thing}
              onValueChange={setThing}
              options={THINGS.filter((option) => option.name.toLowerCase().includes(thing.toLowerCase()))}
              getKey={(option) => option.id}
              onSelect={(option) => setThing(option.name)}
              renderRow={(option, { highlighted }) => (
                <span className="flex items-baseline justify-between gap-4">
                  <span>{option.name}</span>
                  {highlighted ? (
                    <span className="text-sm text-ink-secondary">{option.stock} in stock</span>
                  ) : null}
                </span>
              )}
            />
          </Panel>
        </section>
      </div>
    </main>
  )
}

const meta = { title: 'ComboBox', render: () => <ComboBoxPage /> } satisfies Meta

export default meta

export const ComboBox_: StoryObj<typeof meta> = { name: 'ComboBox' }
