// The controls that appear on the row under the pointer.

import type { Meta, StoryObj } from '@storybook/react-vite'
import { DemoTable } from '../../.storybook/demo'

import { Button } from './Button'
import { Icon } from './Icon'
import { TableRowActions } from './TableRowActions'

const meta = { title: 'TableRowActions' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const RowActions: Story = {
  render: () => (
    <div className="max-w-2xl space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">TableRowActions</h1>
        <p className="mt-1 text-body leading-body text-ink-secondary">
          Hover a row. The actions are the pointer's signal that a row is under it, which is why
          the row itself no longer tints — the cursor row alone owns the background, and two rows
          reading as current at once was the fault that came from sharing it.
        </p>
      </div>

      <DemoTable>
        <tbody>
          {['INV/2026/0067', 'INV/2026/0066', 'INV/2026/0065'].map((number) => (
            <tr key={number} className="group border-b border-stroke last:border-b-0">
              <td className="px-4 py-2 text-ink">{number}</td>
              <td className="px-4 py-2 text-right text-ink-secondary">31,349.03</td>
              <td className="w-24 px-2">
                <TableRowActions>
                  <Button size="icon-sm" variant="ghost" aria-label="Print">
                    <Icon name="printer" />
                  </Button>
                  <Button size="icon-sm" variant="ghost" aria-label="More">
                    <Icon name="more" />
                  </Button>
                </TableRowActions>
              </td>
            </tr>
          ))}
        </tbody>
      </DemoTable>
    </div>
  ),
}
