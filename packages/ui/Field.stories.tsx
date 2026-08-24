// Field and Label together, because neither is worth looking at alone.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Field } from './Field'
import { Label } from './Label'
import { TextField } from './TextField'

const meta = { title: 'Field' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Box({ value = '' }: { value?: string }) {
  return (
    <span className="block h-control rounded-control border border-stroke">
      <TextField aria-label="example" value={value} onChange={() => undefined} />
    </span>
  )
}

export const Fields: Story = {
  render: () => (
    <div className="max-w-md space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">Field</h1>
        <p className="mt-1 text-body leading-body text-ink-secondary">
          One label treatment, one gap, one message line. It exists because there were three of
          each — "Billed to" was a paragraph, the new-party drawer wrote a span, the details
          panel wrote a third, and all of them were the same idea.
        </p>
      </div>

      <div className="space-y-4 rounded-card border border-stroke bg-surface p-6">
        <Field label="Party name">
          <Box value="Sharma Traders" />
        </Field>

        <Field label="Mobile" message="Ten digits, no spaces.">
          <Box value="98450" />
        </Field>

        <Field label="City" reservesMessage>
          <Box value="Indore" />
        </Field>
      </div>

      <div className="rounded-card border border-stroke bg-surface p-6">
        <h2 className="text-heading font-strong text-ink">A label that owns a setting</h2>
        <p className="mt-1 mb-4 text-body leading-body text-ink-secondary">
          Pressing it opens what governs that field — the numbering series behind an invoice
          number, the terms behind a due date. This is the pattern instead of a gear beside every
          field, because a row of gears is one icon meaning six different things. It underlines
          on hover and focus only; nothing here is a link.
        </p>
        <Field
          label="Invoice no."
          onOpenSettings={() => undefined}
          settingsName="Invoice no. — open the numbering series"
        >
          <Box value="INV/2026/0068" />
        </Field>
      </div>

      <div className="rounded-card border border-stroke bg-surface p-6">
        <h2 className="text-heading font-strong text-ink">The label on its own</h2>
        <div className="mt-2 flex gap-6">
          <Label>Plain</Label>
          <Label onOpenSettings={() => undefined} settingsName="Opens a setting">
            Opens a setting
          </Label>
        </div>
      </div>
    </div>
  ),
}
