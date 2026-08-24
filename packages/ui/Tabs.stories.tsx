// The status strip at both densities, plus the two cases that are easy to forget: an option
// with nothing behind it, and a strip whose counts have not been worked out yet.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Tabs, type TabOption } from './Tabs'

type Status = 'all' | 'pend' | 'over' | 'onacc' | 'hold'

const STATUSES: TabOption<Status>[] = [
  { value: 'all', label: 'All', count: 22 },
  { value: 'pend', label: 'Pending', count: 6 },
  { value: 'over', label: 'Overdue', count: 4 },
  { value: 'onacc', label: 'On Acc', count: 3 },
  { value: 'hold', label: 'Hold', count: 2 },
]

const EMPTIED: TabOption<Status>[] = STATUSES.map((option) =>
  option.value === 'over' ? { ...option, count: 0 } : option,
)

const UNCOUNTED: TabOption<Status>[] = STATUSES.map(({ value, label }) => ({ value, label }))

function Row({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 border-b border-stroke py-4 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-ink-secondary">{label}</span>
      <div>
        {children}
        {note ? <p className="mt-2 text-sm text-ink-muted">{note}</p> : null}
      </div>
    </div>
  )
}

function Strip({ options }: { options: TabOption<Status>[] }) {
  const [status, setStatus] = useState<Status>('all')
  return <Tabs options={options} value={status} onChange={setStatus} label="Invoice status" />
}

function Density({ density, label }: { density: string; label: string }) {
  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>
      <div className="mt-2 rounded-card border border-stroke bg-surface px-5">
        <Row label="The status strip" note="Tab once to reach it, then the arrow keys move the choice.">
          <Strip options={STATUSES} />
        </Row>
        <Row label="An empty option" note="Nothing is overdue. The option stays, showing zero — hiding it would make the strip change shape as the data does.">
          <Strip options={EMPTIED} />
        </Row>
        <Row label="Counts not known yet" note="No count is drawn at all. A count of zero and a count nobody has worked out are different things.">
          <Strip options={UNCOUNTED} />
        </Row>
      </div>
    </section>
  )
}

function TabsPage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Tabs</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          One choice out of several, shown as a strip. It looks like tabs and behaves as a
          radio group, because there is no panel underneath it — the list it narrows is
          narrowed by six other controls as well, so it belongs to none of them. Tab reaches
          the strip in one press; the arrow keys move the choice inside it.
        </p>
        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />
      </div>
    </main>
  )
}

const meta = { title: 'Tabs', render: () => <TabsPage /> } satisfies Meta

export default meta

export const Tabs_: StoryObj<typeof meta> = { name: 'Tabs' }
