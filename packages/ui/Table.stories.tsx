// The table with the invoice listing's own columns on it, because a table story with Name
// and Age proves nothing about whether a column of rupees reads down its right edge.
//
// Six rows, one of them cancelled, one of them selected. Tick a row and the header tick goes
// mixed. Tab into the table and the row actions appear where the keyboard is, not only where
// the mouse is.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { Chip, type ChipTone } from './Chip'
import { Table } from './Table'
import type { TableColumn, TableSort } from './TableColumn'

type Invoice = {
  no: string
  date: string
  party: string
  amount: string
  pending: string
  due: string
  status: string
  tone: ChipTone
  cancelled?: boolean
}

const INVOICES: Invoice[] = [
  { no: '4/2026-27', date: '10-06-2026', party: 'Innovate Solutions', amount: '19,381.00', pending: '19,381.00', due: '25-06-2026', status: 'Overdue', tone: 'danger' },
  { no: '6/2026-27', date: '12-06-2026', party: 'NextGen Tech', amount: '31,506.00', pending: '31,506.00', due: '27-06-2026', status: 'Overdue', tone: 'danger' },
  { no: '3/2026-27', date: '08-06-2026', party: 'Sharma Traders', amount: '28,556.00', pending: '28,556.00', due: '08-07-2026', status: 'Pending', tone: 'neutral' },
  { no: '2/2026-27', date: '05-06-2026', party: 'Busy Infotech Pvt. Ltd.', amount: '63,130.00', pending: '25,252.00', due: '20-06-2026', status: 'On Acc', tone: 'info' },
  { no: '10/2026-27', date: '18-06-2026', party: 'Apex Industries', amount: '33,984.00', pending: '33,984.00', due: '10-07-2026', status: 'Hold', tone: 'warning' },
  { no: '22/2026-27', date: '21-06-2026', party: 'Metro Distributors', amount: '8,015.00', pending: '—', due: '11-07-2026', status: 'Cancelled', tone: 'neutral', cancelled: true },
]

const COLUMNS: TableColumn<Invoice>[] = [
  { id: 'date', header: 'Date', width: 'w-32', sortable: true, cell: (row) => row.date },
  { id: 'no', header: 'Invoice No.', width: 'w-32', sortable: true, cell: (row) => row.no },
  { id: 'party', header: 'Party Name', sortable: true, cell: (row) => row.party },
  { id: 'amount', header: 'Invoice Amount', width: 'w-40', align: 'end', sortable: true, cell: (row) => row.amount },
  { id: 'pending', header: 'Pending Amount', width: 'w-40', align: 'end', sortable: true, cell: (row) => row.pending },
  { id: 'due', header: 'Due Date', width: 'w-32', sortable: true, cell: (row) => row.due },
  { id: 'status', header: 'Status', width: 'w-32', cell: (row) => <Chip tone={row.tone}>{row.status}</Chip> },
]

const TOTALS = { amount: '1,84,572.00', pending: '1,38,679.00' }

function Listing({ rows }: { rows: Invoice[] }) {
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set(['3/2026-27']))
  const [sort, setSort] = useState<TableSort>({ columnId: 'date', direction: 'desc' })

  return (
    <div className="overflow-hidden rounded-card border border-stroke bg-surface">
      <Table
        columns={COLUMNS}
        rows={rows}
        getRowId={(row) => row.no}
        label="Invoices"
        isMuted={(row) => row.cancelled === true}
        sort={sort}
        onSort={(columnId) =>
          setSort((was) => ({
            columnId,
            direction: was.columnId === columnId && was.direction === 'asc' ? 'desc' : 'asc',
          }))
        }
        selection={{
          selected,
          label: 'Select every invoice on this page',
          onToggle: (id, next) =>
            setSelected((was) => {
              const now = new Set(was)
              if (next) now.add(id)
              else now.delete(id)
              return now
            }),
          onToggleAll: (next) => setSelected(next ? new Set(rows.map((row) => row.no)) : new Set()),
        }}
        rowActions={(row) => (
          <>
            <Button variant="ghost" size="sm" aria-label={`Send reminder for ${row.no}`}>
              Remind
            </Button>
            <Button variant="ghost" size="sm" aria-label={`Print ${row.no}`}>
              Print
            </Button>
          </>
        )}
        totals={TOTALS}
        totalsLabel={`${rows.length} invoices`}
        empty={<Empty />}
      />
    </div>
  )
}

function Empty() {
  return (
    <div>
      <h3 className="text-lg font-strong text-ink">No invoices match these filters</h3>
      <p className="mt-1 text-sm text-ink-secondary">Current FY · Pending · Party: Sharma Traders</p>
      <div className="mt-4">
        <Button variant="ghost">Clear filters</Button>
      </div>
    </div>
  )
}

function Density({ density, label }: { density: string; label: string }) {
  return (
    <section data-density={density} className="mt-8">
      <h2 className="text-lg font-strong text-ink">{label}</h2>
      <div className="mt-2">
        <Listing rows={INVOICES} />
      </div>
    </section>
  )
}

function TablePage() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-title font-strong tracking-tight">Table</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-secondary">
          A list of records you pick from. Not the item grid: nothing here is typed into, the
          row is the unit, and selection is the point. Hover a row for its actions, or Tab
          into it — the keyboard gets to them too. Tick one row and the header tick goes mixed
          rather than claiming to be off.
        </p>

        <Density density="standard" label="Standard" />
        <Density density="comfortable" label="Comfortable" />

        <section className="mt-8">
          <h2 className="text-lg font-strong text-ink">With the colour taken away</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            The cancelled row still reads as no longer live, the selected row still reads as
            selected, and Overdue is still a word.
          </p>
          <div className="mt-2 grayscale">
            <Listing rows={INVOICES} />
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-lg font-strong text-ink">Nothing to show</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            The empty state names the filters in force, so the way out is on the screen rather
            than something to work out.
          </p>
          <div className="mt-2">
            <Listing rows={[]} />
          </div>
        </section>
      </div>
    </main>
  )
}

const meta = { title: 'Table', render: () => <TablePage /> } satisfies Meta

export default meta

export const Table_: StoryObj<typeof meta> = { name: 'Table' }
