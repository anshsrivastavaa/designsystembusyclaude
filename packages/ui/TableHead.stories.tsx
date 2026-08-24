// The heading row on its own, at the two states that are hard to arrange on a screen: sorted,
// and stuck.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TableHead } from './TableHead'
import type { TableColumn } from './TableColumn'

const meta = { title: 'TableHead' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type Row = { id: string }

const COLUMNS: TableColumn<Row>[] = [
  { id: 'date', header: 'Date', cell: () => null, sortable: true, width: 'w-32' },
  { id: 'number', header: 'Invoice No.', cell: () => null, sortable: true, width: 'w-40' },
  { id: 'party', header: 'Party Name', cell: () => null, sortable: true },
  { id: 'amount', header: 'Invoice Amount', cell: () => null, align: 'end', sortable: true, width: 'w-40' },
]

function Head({ stuck, sorted }: { stuck: boolean; sorted: boolean }) {
  return (
    <table className="w-full rounded-card border border-stroke bg-surface text-body">
      <TableHead<Row>
        columns={COLUMNS}
        stuck={stuck}
        all={false}
        picked={0}
        hasRowActions={false}
        {...(sorted ? { sort: { columnId: 'date', direction: 'desc' as const } } : {})}
        onSort={() => undefined}
      />
      <tbody>
        <tr className="border-t border-stroke">
          <td className="px-3 py-2 text-ink">25-11-2026</td>
          <td className="px-3 py-2 text-ink">INV/2026/0067</td>
          <td className="px-3 py-2 text-ink">Krishna Sales Corporation</td>
          <td className="px-3 py-2 text-right text-ink">31,349.03</td>
        </tr>
      </tbody>
    </table>
  )
}

export const Heads: Story = {
  render: () => (
    <div className="max-w-4xl space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">TableHead</h1>
        <p className="mt-1 text-body leading-body text-ink-secondary">
          The sorted column is DARKER, and that is the state you read across a whole header row
          without hunting; the chevron beside it only confirms which way. The unsorted headings
          are secondary ink rather than muted — muted on this sunken band measures 4.63 against a
          4.5 minimum, which is passing with no headroom at all.
        </p>
      </div>

      <div>
        <p className="mb-2 text-sm font-label text-ink-secondary">At rest — Date is sorted</p>
        <Head stuck={false} sorted />
      </div>

      <div>
        <p className="mb-2 text-sm font-label text-ink-secondary">
          Stuck — the ONE shadow in this product, and only while it is actually holding position
        </p>
        <Head stuck sorted />
      </div>

      <div>
        <p className="mb-2 text-sm font-label text-ink-secondary">Nothing sorted</p>
        <Head stuck={false} sorted={false} />
      </div>
    </div>
  ),
}
