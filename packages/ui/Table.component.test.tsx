// The Table's row states are the whole reason it exists at this step, and every one of them
// is a thing a class name would happily claim while nothing rendered. So each is measured off
// the browser: the painted background, the drawn outline, the computed text decoration.
//
// The claim underneath all of them: hover and keyboard focus do not share a channel. A row
// can be hovered and focused at once, and if both are a background colour, one of them
// silently wins. That fault is already logged against the item grid; this is the test that
// stops it arriving here too.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { Table } from './Table'
import type { TableColumn } from './TableColumn'

type Row = { no: string; party: string; dead?: boolean }

const ROWS: Row[] = [
  { no: '4/2026-27', party: 'Innovate Solutions' },
  { no: '22/2026-27', party: 'Metro Distributors', dead: true },
]

const COLUMNS: TableColumn<Row>[] = [
  { id: 'no', header: 'Invoice No.', cell: (row) => row.no, sortable: true },
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

async function render(extra: Partial<React.ComponentProps<typeof Table<Row>>> = {}) {
  const at = document.createElement('div')
  host.appendChild(at)
  mounted(
    at,
    <Table
      columns={COLUMNS}
      rows={ROWS}
      getRowId={(row) => row.no}
      label="Invoices"
      isMuted={(row) => row.dead === true}
      empty={<p>Nothing here</p>}
      {...extra}
    />,
  )
  // The rows have to be on the screen before anything is measured off them. Counted as rows
  // with CELLS in them: a group heading is a row too, and counting those made the barrier
  // wait for a number it would never reach.
  await settled(() => at.querySelectorAll('tbody tr:has(td)').length === (extra.rows ?? ROWS).length)
  return {
    at,
    rows: () => [...at.querySelectorAll('tbody tr:has(td)')],
    header: (name: string) => [...at.querySelectorAll('th')].find((th) => th.textContent?.includes(name))!,
  }
}

describe('the Table', () => {
  it('keeps hover and keyboard focus on separate channels, so a row can show both', async () => {
    const table = await render({
      rowActions: (row) => <button type="button">Print {row.no}</button>,
    })
    const [first] = table.rows()
    const resting = getComputedStyle(first!).backgroundColor

    const button = first!.querySelector('button')!
    button.focus()
    await settled(() => document.activeElement === button)

    const focused = getComputedStyle(first!)
    // The ring is an outline. The background has not been spent on it, so hover is still
    // free to say its own thing on the same row.
    expect(Number.parseFloat(focused.outlineWidth)).toBeGreaterThan(0)
    expect(focused.outlineStyle).not.toBe('none')
    expect(focused.backgroundColor).toBe(resting)
  })

  it('fades a cancelled row rather than striking every cell through', async () => {
    const table = await render()
    const dead = table.rows()[1]!.querySelector('td')!
    const live = table.rows()[0]!.querySelector('td')!

    // Muted ink, so it reads as no longer live but is still legible — somebody looking at a
    // cancelled invoice is usually checking what it SAID. A line through every cell fights
    // that, and the Status column already carries the word.
    expect(getComputedStyle(dead).color).not.toBe(getComputedStyle(live).color)
    expect(getComputedStyle(dead).textDecorationLine).toBe('none')
  })

  it('draws a heading each time the group changes, and only then', async () => {
    const table = await render({ groupOf: (row: Row) => row.party })

    const headings = [...table.at.querySelectorAll('tbody th[scope="colgroup"]')].map((one) => one.textContent)
    expect(headings).toEqual(['Innovate Solutions', 'Metro Distributors'])
  })

  it('paints a selected row differently from an untouched one', async () => {
    const table = await render({
      selection: {
        selected: new Set(['4/2026-27']),
        onToggle: () => {},
        onToggleAll: () => {},
        label: 'Select all',
      },
    })
    const [chosen, untouched] = table.rows()

    expect(getComputedStyle(chosen!).backgroundColor).not.toBe(getComputedStyle(untouched!).backgroundColor)
  })

  it('holds the row actions out of sight until the keyboard arrives, not permanently', async () => {
    const table = await render({
      rowActions: (row) => <button type="button">Print {row.no}</button>,
    })
    const layer = table.rows()[0]!.querySelector('td:last-child > div')!

    expect(getComputedStyle(layer).opacity).toBe('0')

    table.rows()[0]!.querySelector('button')!.focus()

    // The layer fades in, so reading it one frame later catches it part-way — the first run
    // of this test measured 0.033. Wait for the fade to finish rather than for a fixed time:
    // a sleep long enough today is a flake on a slower machine.
    await new Promise<void>((resolve) => {
      layer.addEventListener('transitionend', () => resolve(), { once: true })
    })

    expect(getComputedStyle(layer).opacity).toBe('1')
  })

  it('tells a screen reader which way a sorted column is sorted', async () => {
    const table = await render({ sort: { columnId: 'no', direction: 'desc' }, onSort: () => {} })

    expect(table.header('Invoice No.').getAttribute('aria-sort')).toBe('descending')
    expect(table.header('Party Name').getAttribute('aria-sort')).toBe(null)
  })

  it('shows the reason there is nothing, rather than an empty table', async () => {
    const table = await render({ rows: [] })

    expect(table.at.querySelector('table')).toBe(null)
    expect(table.at.textContent).toContain('Nothing here')
  })

  it('gives every row the height the density token asks for', async () => {
    const standard = document.createElement('div')
    standard.setAttribute('data-density', 'standard')
    host.appendChild(standard)
    mounted(
      standard,
      <Table columns={COLUMNS} rows={ROWS} getRowId={(row) => row.no} label="Invoices" empty={<p>None</p>} />,
    )

    const comfortable = document.createElement('div')
    comfortable.setAttribute('data-density', 'comfortable')
    host.appendChild(comfortable)
    mounted(
      comfortable,
      <Table columns={COLUMNS} rows={ROWS} getRowId={(row) => row.no} label="Invoices" empty={<p>None</p>} />,
    )
    await settled(
      () =>
        standard.querySelector('tbody tr') !== null && comfortable.querySelector('tbody tr') !== null,
    )

    const tight = standard.querySelector('tbody tr')!.getBoundingClientRect().height
    const roomy = comfortable.querySelector('tbody tr')!.getBoundingClientRect().height
    expect(roomy).toBeGreaterThan(tight)
  })
})
