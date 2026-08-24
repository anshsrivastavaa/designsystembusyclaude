// Every tone a Chip can carry, at both densities, and the same set with the colour taken
// away — because the greyscale row is the check, not a nicety. If a state cannot be told
// apart down there, the colour was doing work the word should have been doing.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Chip, type ChipTone } from './Chip'

const STATES: { label: string; tone: ChipTone; why: string }[] = [
  { label: 'Pending', tone: 'neutral', why: 'The normal state of an unpaid invoice. Nothing is wrong, so nothing is coloured.' },
  { label: 'Overdue', tone: 'danger', why: 'Past its due date and still owed. The one genuinely exceptional state, and the colour sits beside the word.' },
  { label: 'On Acc', tone: 'info', why: 'Part paid, on account. Noteworthy, not alarming.' },
  { label: 'Hold', tone: 'warning', why: 'Deliberately parked by somebody. Waiting on a person, not on the customer.' },
  { label: 'Paid', tone: 'success', why: 'Settled. Green means the thing completed, which is exactly what this is.' },
  { label: 'Cancelled', tone: 'neutral', why: 'Dead. The row itself is struck through, so the chip does not need to shout.' },
]

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline gap-4 border-b border-stroke py-3 last:border-b-0">
      <span className="w-28 shrink-0 text-sm text-ink-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function Density({ density, label }: { density: string; label: string }) {
  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>
      <div className="mt-2 rounded-card border border-stroke bg-surface px-5">
        {STATES.map((state) => (
          <Row key={state.label} label={state.label}>
            <Chip tone={state.tone}>{state.label}</Chip>
            <span className="text-sm text-ink-muted">{state.why}</span>
          </Row>
        ))}
      </div>
    </section>
  )
}

function ChipPage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Chip</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          A label that says what state a record is in. It is read, never pressed. The word
          carries the meaning and the tone only tints it, so a listing still reads with the
          colour taken away.
        </p>

        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />

        <section className="mt-8">
          <h2 className="text-lg font-strong text-ink">With the colour taken away</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            This is the check every screen owes before it ships. Six states, no colour, and
            every one of them still says which it is.
          </p>
          <div className="mt-2 grayscale rounded-card border border-stroke bg-surface px-5 py-4">
            <div className="flex flex-wrap items-center gap-3">
              {STATES.map((state) => (
                <Chip key={state.label} tone={state.tone}>
                  {state.label}
                </Chip>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

const meta = { title: 'Chip', render: () => <ChipPage /> } satisfies Meta

export default meta

export const Chip_: StoryObj<typeof meta> = { name: 'Chip' }
