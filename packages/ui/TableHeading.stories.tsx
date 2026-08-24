// One heading cell, drawn both ways it can be drawn — and the two treatments that exist in the
// product today, side by side, at both densities.
//
// THE PICTURE IS THE DECISION. The listing's heading and the item grid's were each argued for
// separately and neither is wrong: the listing is a row of words over records you read, the
// grid is a row of labels over cells you type into. Merging them moves a baseline on one of
// the two screens, so it is Aj's call from the drawing rather than an inference from the code.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TableHeading } from './TableHeading'

const meta = { title: 'TableHeading' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const COLUMNS = ['Date', 'Invoice No.', 'Party Name', 'Invoice Amount']
const CELLS = ['25-11-2026', 'INV/2026/0067', 'Krishna Sales Corporation', '31,349.03']

/** What the listing wears today, and what TableHeading draws. */
function AsTheListing() {
  return (
    <table className="w-full border-separate border-spacing-0 rounded-card border border-stroke bg-surface">
      <thead>
        <tr>
          {COLUMNS.map((header, index) => (
            <TableHeading key={header} sticky={false} align={index === 3 ? 'end' : 'start'}>
              {header}
            </TableHeading>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr className="h-row">
          {CELLS.map((cell, index) => (
            <td key={cell} className={`truncate border-b border-stroke px-3 text-body text-ink ${index === 3 ? 'text-right' : ''}`}>
              {cell}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

/** What the item grid and the sundry grid wear today: caps, strong, uppercase, muted ink. */
function AsTheGrid() {
  return (
    <div className="rounded-card border border-stroke bg-surface">
      <div role="row" className="flex">
        {COLUMNS.map((header, index) => (
          <div
            key={header}
            role="columnheader"
            className={`flex h-control-sm flex-1 items-center border-r border-stroke bg-surface-sunken px-2 text-caps font-strong tracking-wide uppercase text-ink-muted last:border-r-0 ${index === 3 ? 'justify-end' : ''}`}
          >
            {header}
          </div>
        ))}
      </div>
      <div role="row" className="flex h-row">
        {CELLS.map((cell, index) => (
          <div key={cell} className={`flex flex-1 items-center truncate border-t border-stroke px-2 text-body text-ink ${index === 3 ? 'justify-end' : ''}`}>
            {cell}
          </div>
        ))}
      </div>
    </div>
  )
}

function Pair({ density, label }: { density: string; label: string }) {
  return (
    <div data-density={density}>
      <p className="mb-3 text-sm font-label text-ink-muted">{label}</p>
      <div className="space-y-6">
        <div>
          <p className="mb-1 text-sm text-ink-secondary">The listing — text-sm, label weight, secondary ink</p>
          <AsTheListing />
        </div>
        <div>
          <p className="mb-1 text-sm text-ink-secondary">The item and sundry grids — caps, strong, uppercase, muted ink</p>
          <AsTheGrid />
        </div>
      </div>
    </div>
  )
}

export const TheTwoTreatments: Story = {
  render: () => (
    <main className="min-h-screen bg-surface-page p-8">
      <div className="grid max-w-6xl grid-cols-2 gap-8">
        <Pair density="standard" label="Standard" />
        <Pair density="comfortable" label="Comfortable" />
      </div>
    </main>
  ),
}

export const BothWays: Story = {
  render: () => (
    <div className="space-y-8 bg-surface p-8">
      <div>
        <p className="mb-2 text-sm text-ink-muted">As a table — the listing</p>
        <AsTheListing />
      </div>
      <div>
        <p className="mb-2 text-sm text-ink-muted">As plain elements — same component, grid roles</p>
        <div role="row" className="flex rounded-card border border-stroke">
          {COLUMNS.map((header, index) => (
            <TableHeading key={header} as="div" sticky={false} align={index === 3 ? 'end' : 'start'} className="flex-1">
              {header}
            </TableHeading>
          ))}
        </div>
      </div>
    </div>
  ),
}
