// The pin on a heading, which is a ruling this codebase already carries as a sentence: docs/
// gates.md writes it as `it('shows the pin on hover and focus only, never at rest')`. The rule
// and the thing that proves it are the same words, so they cannot disagree.
//
// Its own file because the freeze and resize tests fill columns.component.test.tsx to its cap,
// and the pin is its own behaviour rather than more of theirs.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { useColumns } from './columns'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { Table } from './Table'
import type { TableColumn } from './TableColumn'

type Row = { no: string; party: string }

const ROWS: Row[] = [
  { no: '4/2026-27', party: 'Innovate Solutions' },
  { no: '9/2026-27', party: 'Sharma Traders' },
]

const COLUMNS: TableColumn<Row>[] = [
  { id: 'no', header: 'Invoice No.', cell: (row) => row.no },
  { id: 'party', header: 'Party Name', cell: (row) => row.party },
]

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

function Pinnable({ onPin }: { onPin: (id: string, side: 'start' | 'end') => void }) {
  const layout = useColumns({
    columns: COLUMNS.map((column) => ({ id: column.id })),
    widths: {},
    onResize: () => {},
    pins: { start: [], end: [] },
    onPin,
  })
  return (
    <Table columns={COLUMNS} rows={ROWS} getRowId={(row) => row.no} label="Invoices" empty={<p>None</p>} layout={layout} />
  )
}

describe('the pin on a heading', () => {
  const pinned = () => host.querySelector<HTMLElement>('[aria-label="Freeze up to this column"]')!

  it('shows the pin on hover and focus only, never at rest', async () => {
    mounted(host, <Pinnable onPin={() => {}} />)
    await settled(() => host.querySelector('[aria-label="Freeze up to this column"]') !== null)

    // AT REST. Asked of the computed style rather than of a class, and of opacity rather than
    // toBeVisible — which ignores opacity and has stood in for "on the screen" three times here.
    expect(Number(getComputedStyle(pinned()).opacity)).toBe(0)

    // ON FOCUS. The heading holds it, and the pin is inside — group-focus-within, so reaching
    // the heading from the keyboard is enough.
    pinned().focus()
    // Waited on the STATE, not on the change having begun: the pin fades in over swift, and a
    // probe that fires the moment opacity leaves zero catches it at 0.41 and reads as a fault.
    await settled(() => Number(getComputedStyle(pinned()).opacity) === 1)
  })

  it('freezes up to the column pressed rather than that column alone', async () => {
    const asked: { id: string; side: string }[] = []
    mounted(host, <Pinnable onPin={(id, side) => asked.push({ id, side })} />)
    await settled(() => host.querySelector('[aria-label="Freeze up to this column"]') !== null)

    // The SECOND heading, so "up to and including" is different from "this one".
    const pins = [...host.querySelectorAll<HTMLElement>('[aria-label="Freeze up to this column"]')]
    pins[1]!.click()
    await settled(() => asked.length > 0)
    expect(asked[0]).toEqual({ id: COLUMNS[1]!.id, side: 'start' })
  })
})

// The caps ruling, held where it can actually fail.
//
// `uppercase` on the heading cell was inherited by nothing that mattered: Tailwind's preflight
// carries `button { text-transform: none }`, and a sortable heading wraps its words in a button.
// The computed style on the CELL said uppercase while the screen said "Date", so a test that
// asked the cell would have passed on a screen that ignored the ruling. It asks the button.
describe('the heading treatment', () => {
  it('draws the words in caps even inside the sort button, which preflight resets', async () => {
    mounted(host, <Pinnable onPin={() => {}} />)
    await settled(() => host.querySelector('thead button') !== null)

    const words = host.querySelector<HTMLElement>('thead button')!
    expect(getComputedStyle(words).textTransform).toBe('uppercase')
  })
})
