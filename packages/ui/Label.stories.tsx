// The label on its own, because the thing worth looking at is the difference between a label
// that is a word and a label that is a control.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Label } from './Label'

const meta = { title: 'Label' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const Labels: Story = {
  render: () => (
    <div className="max-w-xl space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">Label</h1>
        <p className="mt-1 text-body leading-body text-ink-secondary">
          One treatment for the words beside a control. A label that OWNS a setting is a control:
          pressing it opens what governs that field. That is the pattern instead of a gear beside
          every field — a row of gears is one icon meaning six different things.
        </p>
      </div>

      <div className="space-y-4 rounded-card border border-stroke bg-surface p-6">
        <div>
          <Label>Party name</Label>
          <p className="text-body text-ink">A plain word. It takes no focus and reacts to nothing.</p>
        </div>
        <div>
          <Label onOpenSettings={() => undefined} settingsName="Invoice no. — open the numbering series">
            Invoice no.
          </Label>
          <p className="text-body text-ink">
            Underlines on hover and on focus, and nowhere else. Nothing here is a link, and the
            ones that open something are found by trying.
          </p>
        </div>
      </div>
    </div>
  ),
}
