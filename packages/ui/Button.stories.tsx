// Every state a Button can be in, at both densities, on one page. A component is not
// finished until all of its states are here, because a state nobody put on this page is a
// state nobody has looked at.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Icon } from './Icon'
import { Button } from './Button'

function Trash() {
  return (
    <Icon name="plus" />
  )
}

const SIZES = ['sm', 'default', 'lg'] as const
const ICON_SIZES = ['icon-sm', 'icon', 'icon-lg'] as const

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 border-b border-stroke py-4 last:border-b-0">
      <span className="w-40 shrink-0 text-sm text-ink-secondary">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

function Density({ density, label }: { density: string; label: string }) {
  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>

      <div className="mt-2 rounded-card border border-stroke bg-surface px-5">
        <Row label="Primary">
          {SIZES.map((size) => (
            <Button key={size} size={size}>
              Save invoice
            </Button>
          ))}
        </Row>

        <Row label="Quiet">
          {SIZES.map((size) => (
            <Button key={size} variant="ghost" size={size}>
              Add row
            </Button>
          ))}
        </Row>

        <Row label="With an icon">
          <Button>
            <Trash />
            Delete
          </Button>
          <Button variant="ghost">
            <Trash />
            Delete
          </Button>
        </Row>

        <Row label="Icon only">
          {ICON_SIZES.map((size) => (
            <Button key={size} size={size} variant="ghost" aria-label="Delete row">
              <Trash />
            </Button>
          ))}
        </Row>

        <Row label="Disabled">
          <Button disabled>Save invoice</Button>
          <Button variant="ghost" disabled>
            Add row
          </Button>
        </Row>

        <Row label="Too much text">
          <Button>Save this invoice and start another one straight away</Button>
        </Row>
      </div>
    </section>
  )
}

function ButtonPage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Button</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          Three heights, and each one changes with density: 32, 26 and 38 at standard, 44, 36
          and 50 at comfortable. Hover a button to see the fill step down, and press Tab to
          walk the focus ring through them.
        </p>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          There is no red button and no grey one. Deleting a row is an icon with no colour,
          and the quiet button returns at step 4 as Cancel, white with a border.
        </p>

        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />
      </div>
    </main>
  )
}

const meta = {
  title: 'Button',
  render: () => <ButtonPage />,
} satisfies Meta

export default meta

export const Button_: StoryObj<typeof meta> = { name: 'Button' }
