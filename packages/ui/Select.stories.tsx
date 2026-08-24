import type { Meta, StoryObj } from '@storybook/react-vite'
import { DemoRow } from '../../.storybook/demo'
import * as React from 'react'

import { Select } from './Select'

const meta = {
  title: 'Library/Select',
  component: Select,
} satisfies Meta<typeof Select>

export default meta

const ROWS = [
  { value: '25', label: '25' },
  { value: '50', label: '50' },
  { value: '100', label: '100' },
]

const ROUNDING = [
  { value: 'up', label: 'Auto', note: 'up to the next rupee' },
  { value: 'nearest', label: 'Auto', note: 'nearest rupee' },
  { value: 'off', label: 'Off', note: 'exact paise' },
]

/** THE FULL STATE MATRIX, for each variant. A component is done when its story shows every state
 *  it can be in — states get added reactively otherwise, one screen at a time, and nobody comes
 *  back for the rest. Read-only and loading are absent on purpose and say why. */
export const Everything: StoryObj = {
  render: () => {
    const [rows, setRows] = React.useState('50')
    const [rounding, setRounding] = React.useState('nearest')

    return (
      <div className="min-h-screen bg-surface-page px-8 py-10 text-ink">
        <h1 className="text-title font-strong tracking-tight text-ink">Select</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          One of a short list of fixed answers. It stays a native control: the operating system's
          own picker on a tablet, typeahead-searchable, and every screen reader already knows what
          it is. <code>ComboBox</code> is the other case — a long list you have to search.
        </p>

        <div className="mt-6 max-w-2xl rounded-card border border-stroke bg-surface p-6">
          <DemoRow label="Rest">
            <Select label="Rows per page" value={rows} onChange={setRows} options={ROWS} />
          </DemoRow>

          <DemoRow label="Hover" note="Point at it — the border and fill are the platform's own.">
            <Select label="Rows per page, hover" value={rows} onChange={setRows} options={ROWS} />
          </DemoRow>

          <DemoRow label="Active" note="Held down: it gives way, like every other pressable thing.">
            <Select label="Rows per page, active" value={rows} onChange={setRows} options={ROWS} />
          </DemoRow>

          <DemoRow label="Focus-visible" note="Tab to it. The ring is the one every control wears.">
            <Select label="Rows per page, focused" value={rows} onChange={setRows} options={ROWS} />
          </DemoRow>

          <DemoRow label="Selected" note="A chosen value is what the closed control shows.">
            <Select label="Rounding" value={rounding} onChange={setRounding} options={ROUNDING} />
          </DemoRow>

          <DemoRow label="Invalid" note="A soft fill, not a red border alone — and aria-invalid, so it is not a colour-only signal.">
            <Select label="Rounding, invalid" invalid value={rounding} onChange={setRounding} options={ROUNDING} />
          </DemoRow>

          <DemoRow label="Disabled" note="Off, and it says why on hover. Nothing is disabled here without a reason.">
            <Select
              label="Rounding, off"
              disabled
              reason="Rounding is decided by the company, not per invoice"
              value={rounding}
              onChange={setRounding}
              options={ROUNDING}
            />
          </DemoRow>

          <DemoRow label="Small" note="For a control inside a strip rather than a form.">
            <Select size="sm" label="Rows per page, small" value={rows} onChange={setRows} options={ROWS} />
          </DemoRow>

          <DemoRow label="Filling its space" align="top">
            <div className="flex w-80 items-center gap-2">
              <span className="shrink-0 text-sm text-ink-secondary">State</span>
              <Select fill label="State" value={rows} onChange={setRows} options={ROWS} />
            </div>
          </DemoRow>
        </div>

        <p className="mt-6 max-w-2xl text-sm text-ink-muted">
          <strong>Read-only</strong> and <strong>loading</strong> are not drawn, and that is not an
          omission. A native select has no read-only state — the platform gives it none, and
          disabled is the honest answer for a choice somebody may not change. Nothing here loads:
          the options are a fixed list, decided before the control is drawn.
        </p>
      </div>
    )
  },
}
