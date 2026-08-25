// Every state a Toggle can be in, and the real one it was built for: "Show line items" in
// the listing's Table view, which expands every invoice into the items on it.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import * as React from 'react'
import { DemoRow } from '../../.storybook/demo'

import { Toggle } from './Toggle'


/** The switch doing its real job: what it names changes as it moves, with nothing to confirm. */
function LineItems() {
  const [on, setOn] = useState(false)

  return (
    <div className="w-96 rounded-card border border-stroke bg-surface p-3">
      <Toggle checked={on} onCheckedChange={setOn}>
        Show line items
      </Toggle>
      <div className="mt-3 border-t border-stroke pt-3 text-body">
        <div className="flex justify-between text-ink">
          <span>4/2026-27 · Innovate Solutions</span>
          <span>19,381.00</span>
        </div>
        {on ? (
          <div className="mt-1 space-y-1 pl-4 text-sm text-ink-secondary">
            <div className="flex justify-between">
              <span>Corn Ice Cream · 200 Dozen</span>
              <span>18,000.00</span>
            </div>
            <div className="flex justify-between">
              <span>Freight</span>
              <span>250.00</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Density({ density, label }: { density: string; label: string }) {
  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>
      <div className="mt-2 rounded-card border border-stroke bg-surface px-5">
        <DemoRow align="top" label="Off">
          <Toggle checked={false} onCheckedChange={() => {}}>
            Show line items
          </Toggle>
        </DemoRow>
        <DemoRow align="top" label="On">
          <Toggle checked onCheckedChange={() => {}}>
            Show line items
          </Toggle>
        </DemoRow>
        <DemoRow align="top" label="Disabled, off" note="Nothing is disabled without saying why. That line IS the control's reason, not a caption about the story.">
          <Toggle checked={false} disabled onCheckedChange={() => {}}>
            Show line items — grouping is on, turn grouping off to see them
          </Toggle>
        </DemoRow>
        <DemoRow align="top" label="Disabled, on">
          <Toggle checked disabled onCheckedChange={() => {}}>
            Show line items
          </Toggle>
        </DemoRow>
        <DemoRow align="top" label="Doing its real job" note="It takes effect as it moves. If it needed an OK button after it, it was a checkbox.">
          <LineItems />
        </DemoRow>

        <DemoRow
          align="top"
          label="Icon, on and off"
          note="Filled is on, outline is off, and the ink steps down as well — both survive the colour being taken away. The role, the aria-checked and the keyboard are identical to the track version, which is why this is a variant."
        >
          <IconRow />
        </DemoRow>

        <DemoRow align="top" label="Icon, disabled" note="Off, and it says why on hover.">
          <div className="flex gap-1">
            <Toggle look="icon" icon="whatsapp" checked onCheckedChange={() => {}} disabled title="Not built yet">
              WhatsApp
            </Toggle>
            <Toggle look="icon" icon="printer" checked={false} onCheckedChange={() => {}} disabled title="Not built yet">
              Print
            </Toggle>
          </div>
        </DemoRow>
      </div>
    </section>
  )
}

function TogglePage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Toggle</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          A switch. What it names changes the moment it moves, with nothing to confirm — that
          is what separates it from a Checkbox, which states an intention something else acts
          on later. The knob travels as well as the track colouring, so on and off are told
          apart by shape before any colour is read.
        </p>
        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />

        <section className="mt-8">
          <h2 className="text-lg font-strong text-ink">With the colour taken away</h2>
          <div className="mt-2 flex items-center gap-8 grayscale rounded-card border border-stroke bg-surface px-5 py-4">
            <Toggle checked={false} onCheckedChange={() => {}}>
              Off
            </Toggle>
            <Toggle checked onCheckedChange={() => {}}>
              On
            </Toggle>
          </div>
        </section>
      </div>
    </main>
  )
}

const meta = { title: 'Toggle', render: () => <TogglePage /> } satisfies Meta

export default meta

/** The save tail's three: send it, print it, email it. Each is a THING rather than a setting,
 *  which is why they are glyphs with names rather than a column of labelled switches. */
function IconRow() {
  const [on, setOn] = React.useState<Record<string, boolean>>({ whatsapp: true, printer: false, email: false })
  const set = (key: string) => (next: boolean) => setOn((was) => ({ ...was, [key]: next }))

  return (
    <div className="flex gap-1 rounded-card border border-stroke bg-surface p-2">
      <Toggle look="icon" icon="whatsapp" checked={on.whatsapp ?? false} onCheckedChange={set('whatsapp')}>
        WhatsApp
      </Toggle>
      <Toggle look="icon" icon="printer" checked={on.printer ?? false} onCheckedChange={set('printer')}>
        Print
      </Toggle>
      <Toggle look="icon" icon="email" checked={on.email ?? false} onCheckedChange={set('email')}>
        Email
      </Toggle>
    </div>
  )
}

export const Toggle_: StoryObj<typeof meta> = { name: 'Toggle' }
