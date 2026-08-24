// Both states, and the reason there are two.
//
// Collapsed is what a title row carries almost all of the time. Opened is what it becomes, and
// the point of the story is the WIDTH: the field is the widest thing in the row, which is why
// it is not sitting there permanently.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { SearchBox } from './SearchBox'

const meta = { title: 'SearchBox' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/** A title row, so the push is visible rather than described. */
function Row({ startOpen }: { startOpen: boolean }) {
  const [value, setValue] = useState(startOpen ? '4/2026-27' : '')
  const [open, setOpen] = useState(startOpen)

  return (
    <div className="flex items-center gap-3 bg-surface p-4">
      <h2 className="mr-auto text-title font-strong text-ink">Invoices</h2>
      <SearchBox
        value={value}
        onValueChange={setValue}
        open={open}
        onOpenChange={setOpen}
        label="Search invoices"
        placeholder="Invoice number or party"
        shortcut="/"
      />
      <span className="text-body text-ink-secondary">Current FY</span>
      <span className="text-body text-ink-secondary">Filters</span>
      <Button>New</Button>
    </div>
  )
}

export const Closed: Story = { render: () => <Row startOpen={false} /> }
export const Open: Story = { render: () => <Row startOpen /> }
