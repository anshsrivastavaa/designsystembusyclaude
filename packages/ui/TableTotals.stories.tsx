// The summary strip on its own, at the two shapes it actually takes: figures under their own
// columns with the pager to the left of them, and the whole bar given over to one thing when
// nothing is being totalled.

import type { Meta, StoryObj } from '@storybook/react-vite'

import type { TableColumn } from './TableColumn'
import { TableTotals } from './TableTotals'

const meta = { title: 'TableTotals' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type Row = { id: string }

const COLUMNS: TableColumn<Row>[] = [
  { id: 'date', header: 'Date', cell: () => null, width: 'w-32' },
  { id: 'number', header: 'Invoice No.', cell: () => null, width: 'w-40' },
  { id: 'party', header: 'Party Name', cell: () => null },
  { id: 'total', header: 'Invoice Amount', cell: () => null, align: 'end', width: 'w-40' },
  { id: 'pending', header: 'Receivable', cell: () => null, align: 'end', width: 'w-40' },
]

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-8">
      <table className="w-full table-fixed border-separate border-spacing-0 rounded-card border border-stroke bg-surface text-body">
        <colgroup>
          {COLUMNS.map((column) => (
            <col key={column.id} className={column.width} />
          ))}
        </colgroup>
        <tbody>
          <tr className="h-row">
            {COLUMNS.map((column) => (
              <td key={column.id} className="border-b border-stroke px-3 text-ink-secondary">
                {column.header}
              </td>
            ))}
          </tr>
        </tbody>
        {children}
      </table>
    </div>
  )
}

export const Figures: Story = {
  render: () => (
    <Frame>
      <TableTotals
        columns={COLUMNS}
        totals={{ total: '18,42,650.00', pending: '4,17,900.00' }}
        leadSpan={3}
        totalsLabel={<span className="text-ink-secondary">65 invoices</span>}
        hasSelection={false}
        hasRowActions={false}
      />
    </Frame>
  ),
}

export const WholeBar: Story = {
  render: () => (
    <Frame>
      <TableTotals
        columns={COLUMNS}
        totals={{}}
        leadSpan={COLUMNS.length}
        totalsLabel={<span className="text-ink">Nothing is totalled, so the bar is one thing</span>}
        hasSelection={false}
        hasRowActions={false}
      />
    </Frame>
  ),
}
