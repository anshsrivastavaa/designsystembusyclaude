// The column list, at the three states that are hard to arrange on a screen: a column that
// cannot be turned off, one waiting on a field the record does not carry, and a stack of pinned
// ones with their positions showing.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { ColumnList, type ColumnListItem } from './ColumnList'
import { useRef } from 'react'

const meta = { title: 'ColumnList' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const GROUPS = ['The invoice', 'Money', 'Compliance']

const ITEMS: ColumnListItem[] = [
  { id: 'date', header: 'Date', group: 'The invoice', locked: true },
  { id: 'number', header: 'Invoice No.', group: 'The invoice', locked: true, pinnedAt: { side: 'left', place: 1, of: 2 } },
  { id: 'party', header: 'Party Name', group: 'The invoice', locked: true, pinnedAt: { side: 'left', place: 2, of: 2 } },
  { id: 'due', header: 'Due Date', group: 'The invoice' },
  { id: 'total', header: 'Invoice Amount', group: 'Money' },
  { id: 'pending', header: 'Receivable', group: 'Money', pinnedAt: { side: 'right', place: 1, of: 1 } },
  { id: 'received', header: 'Received', group: 'Money' },
  { id: 'eInvoice', header: 'E-Invoice', group: 'Compliance' },
  { id: 'ewbNo', header: 'E-Way Bill No.', group: 'Compliance', waitingOn: 'the e-way bill number' },
]

export const Everything: Story = {
  render: () => {
    const anchor = useRef<HTMLButtonElement>(null)
    const [open, setOpen] = useState(true)
    const [hidden, setHidden] = useState<string[]>(['received'])

    return (
      <div className="p-8">
        <Button ref={anchor} variant="outline" onClick={() => setOpen((was) => !was)}>
          Column setup
        </Button>
        <ColumnList
          open={open}
          onClose={() => setOpen(false)}
          anchorRef={anchor}
          groups={GROUPS}
          items={ITEMS}
          hidden={hidden}
          onToggle={(id) => setHidden((was) => (was.includes(id) ? was.filter((one) => one !== id) : [...was, id]))}
          onUnpinAll={() => undefined}
        />
      </div>
    )
  },
}
