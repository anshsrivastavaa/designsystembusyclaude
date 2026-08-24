// The key cap on its own, and beside the things it actually appears beside.
//
// The zero is on purpose in every one of these. It is the glyph that showed the caps were being
// drawn in the browser's monospace rather than the product's own face, and it is the glyph to
// look at first if that ever comes back.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { Shortcut } from './Shortcut'

const meta = { title: 'Shortcut' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const KEYS = ['F2', 'F10', 'F4', 'Esc', 'Ctrl', 'N', '↵', 'Space']

export const EveryKey: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <div className="flex flex-wrap items-center gap-3">
        {KEYS.map((key) => (
          <Shortcut key={key} keyName={key} />
        ))}
      </div>

      {/* Two keys pressed together are two caps and a thin join, written by the caller — a
          component that took "Ctrl+N" would have to parse a string to draw two boxes. */}
      <div className="mt-6 flex items-center gap-1 text-body text-ink-secondary">
        <Shortcut keyName="Ctrl" />
        <span className="text-ink-muted">+</span>
        <Shortcut keyName="N" />
        <span className="ml-2">creates a new invoice</span>
      </div>
    </div>
  ),
}

export const WhereTheyAppear: Story = {
  render: () => (
    <div className="bg-surface-page p-8">
      {/* Against a field, which is where the party hint sits. */}
      <div className="flex w-96 items-center gap-2 rounded-control border border-stroke bg-surface px-3 py-2">
        <span className="flex-1 text-body text-ink-muted">Search a party…</span>
        <Shortcut keyName="F10" />
      </div>

      {/* In a menu, where the cap sits at the far end of a line of words. */}
      <div className="mt-6 w-96 rounded-card border border-stroke bg-surface py-1">
        {[
          { what: 'New invoice', key: 'F2' },
          { what: 'Search', key: 'Ctrl' },
          { what: 'Clear what is open', key: 'Esc' },
        ].map((row) => (
          <div key={row.what} className="flex items-center justify-between gap-6 px-3 py-1.5 text-body">
            <span className="text-ink">{row.what}</span>
            <Shortcut keyName={row.key} />
          </div>
        ))}
      </div>

      {/* On a filled control, where the quiet step disappears into the fill and the strong tone
          borrows the ink already sitting on it. */}
      <div className="mt-6">
        <Button>
          Save
          <Shortcut keyName="F10" tone="strong" />
        </Button>
      </div>
    </div>
  ),
}
