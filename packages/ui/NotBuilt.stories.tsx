// The two states side by side, because the whole point is that they are DIFFERENT — and today
// they look identical.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { NotBuiltMark, NotBuiltNote } from './NotBuilt'

const meta = { title: 'NotBuilt' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

function Row({ label, mark, reason }: { label: string; mark: boolean; reason: string }) {
  return (
    <span title={reason} className="flex w-64 cursor-not-allowed items-center gap-2 px-3 py-1.5 text-body text-ink opacity-50">
      {mark ? <NotBuiltMark /> : <span aria-hidden="true" className="size-icon-xs shrink-0" />}
      {label}
    </span>
  )
}

export const TheTwoStates: Story = {
  render: () => (
    <div className="flex gap-10 bg-surface p-8">
      <div>
        <p className="mb-2 text-sm font-label text-ink-muted">A gap in the product — the dot</p>
        <Row label="Print" mark reason="Printing is not built yet" />
        <Row label="Download PDF" mark reason="The PDF template is not built yet" />
        <Row label="Share" mark reason="Sharing is not built yet" />
      </div>

      <div>
        <p className="mb-2 text-sm font-label text-ink-muted">A fact about this invoice — no dot</p>
        <Row label="Record a payment" mark={false} reason="Nothing is outstanding on this invoice" />
        <Row label="Generate E-Invoice" mark={false} reason="This invoice is cancelled" />
        <Row label="Send reminder" mark={false} reason="Nothing is outstanding on this invoice" />
      </div>
    </div>
  ),
}

export const WhenNothingIsAvailable: Story = {
  render: () => (
    <div className="bg-surface-page p-8">
      <div className="w-64 rounded-card border border-stroke bg-surface-raised py-1 shadow-popover">
        <NotBuiltNote />
        <div className="border-t border-stroke pt-1">
          {['Print', 'Share', 'Download PDF', 'Send reminder', 'Duplicate'].map((label) => (
            <span key={label} className="flex cursor-not-allowed px-3 py-1.5 text-body text-ink opacity-50">
              {label}
            </span>
          ))}
        </div>
      </div>
      <p className="mt-4 max-w-sm text-sm text-ink-muted">
        Said once at the top. The rows below stop repeating it, and no row carries a mark it
        would otherwise carry five times.
      </p>
    </div>
  ),
}
