// The band on its own, between two runs of rows, which is the only place it means anything.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TableGroupHeading } from './TableGroupHeading'

const meta = { title: 'TableGroupHeading' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const ROWS = [
  { party: 'Sharma Traders', number: '4/2026-27', amount: '1,25,000.00' },
  { party: 'Sharma Traders', number: '9/2026-27', amount: '48,600.00' },
  { party: 'Zenith Industries', number: '11/2026-27', amount: '2,04,150.00' },
]

export const BetweenTwoParties: Story = {
  render: () => (
    <table className="w-full rounded-card border border-stroke bg-surface text-body">
      <tbody>
        {ROWS.map((row, index) => (
          <>
            {index === 0 || ROWS[index - 1]?.party !== row.party ? (
              <TableGroupHeading key={row.party} label={row.party} span={2} />
            ) : null}
            <tr key={row.number} className="h-row bg-surface">
              <td className="border-b border-stroke px-3 text-ink">{row.number}</td>
              <td className="border-b border-stroke px-3 text-end text-ink">{row.amount}</td>
            </tr>
          </>
        ))}
      </tbody>
    </table>
  ),
}
