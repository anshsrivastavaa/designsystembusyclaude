// The strip under the item grid. It is ALWAYS THERE, and it fills for the item under the
// cursor.
//
// ALWAYS THERE IS THE POINT. Ours appeared and disappeared, so the whole page moved every time
// the cursor left the last row — v2 keeps it present and empty, and a layout that does not move
// is worth more than a strip that saves twenty pixels when it has nothing to say.
//
// WHAT IT SHOWS, left to right, which is v2's order: the ITEM'S NAME, then stock and unit, the
// HSN and the rate that follows from it, what this customer paid last time, what the price list
// says, and — for an owner — the profit, pinned to the right. Each is a fact about ONE row at
// ONE moment, which is exactly why none of them is a column: a column of "last rate" would be
// read down, and nobody has ever wanted that.
//
// THE NAME LEADS, and it was missing. Every other fact on the strip is about something, and
// without the name the strip is five numbers with no subject — on a fifty-line invoice, which
// row's stock is that? v2 opens with it.
//
// EMPTY SAYS NOTHING AT ALL. This read "Stand on an item to see its stock, rate and history",
// which is the exact sentence v2 removed on purpose (Aj, 12-08): it advertises facts instead of
// showing them, and a strip that describes itself is a strip nobody reads once they know. The
// HEIGHT stays, so nothing on the screen moves — that was always the reason it is always there.
//
// AND A NAME THAT IS NOT AN ITEM YET GETS ITS OWN LINE. Typing something the list did not match
// is the commonest way a new item is made here, and the strip is where the screen says what
// will happen to it.
//
// PROFIT IS THE BILL'S UNTIL THE CURSOR IS ON AN ITEM ROW, and then it is that line's. One
// strip, two answers, and the label says which — so it is never ambiguous which you are
// reading.

import { useMemo } from 'react'

import { formatPaise } from '../../lib/money'
import { profitOf } from '../../lib/profit'
import { useInvoice } from './store'

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className="flex shrink-0 items-baseline gap-1">
      <span className="text-ink-muted">{label}</span>
      <span className="text-ink">{children}</span>
    </span>
  )
}

export function ItemStrip() {
  const rows = useInvoice((state) => state.rows)
  const cursor = useInvoice((state) => state.cursor)
  const gridEngaged = useInvoice((state) => state.gridEngaged)
  const settings = useInvoice((state) => state.settings)
  const showsProfit = useInvoice((state) => state.showsProfit)
  const facts = useInvoice((state) => state.itemFacts)

  const row = rows[cursor.row]
  const onItemRow = gridEngaged && row?.itemId != null
  const taxIsInside = settings.taxMode === 'itemInclusive'
  const about = onItemRow && row?.itemId != null ? facts[row.itemId] : undefined
  // Typed, and not an item. Only while the grid actually holds the keyboard — a half-typed name
  // left on a row the cursor walked away from is not something the screen should be promising
  // to create.
  const beingNamed = gridEngaged && row?.itemId == null && (row?.itemName ?? '') !== '' ? row?.itemName : null

  const shown = useMemo(() => {
    if (onItemRow && row) return profitOf([row], taxIsInside)
    return profitOf(rows, taxIsInside)
  }, [rows, row, onItemRow, taxIsInside])

  return (
    <div
      aria-label="Item information"
      // h-control-sm, not min-height: the strip is exactly one control tall whether it is full
      // or empty, so nothing below it ever moves.
      className="flex h-control-sm shrink-0 items-center gap-4 overflow-hidden rounded-card border border-stroke bg-surface px-3 text-sm text-ink-secondary"
    >
      {about === undefined ? (
        beingNamed === null ? null : (
          <span className="truncate text-ink-secondary">
            New item “<span className="font-label text-ink">{beingNamed}</span>” — created on save. Press Enter, then set the quantity.
          </span>
        )
      ) : (
        <>
          <Fact label="Item">
            <span className="font-label">{row?.itemName}</span>
          </Fact>
          {/* NEGATIVE STOCK SAYS THE WORD AS WELL AS THE SIGN. It is one of the few genuinely
              exceptional things on this screen — you are selling what you do not have — and it
              is the case red is for. The word carries it where the colour cannot. */}
          <Fact label="Stock">
            {about.stock < 0 ? (
              <span className="font-label text-danger">
                {about.stock} {row?.unit} — short
              </span>
            ) : (
              <>
                {about.stock} {row?.unit === '' ? '' : row?.unit}
              </>
            )}
          </Fact>
          <Fact label="HSN">{about.hsn === '' ? '—' : about.hsn}</Fact>
          <Fact label="GST">{row?.taxTreatment === 'taxable' ? `${row.taxPercent}%` : (row?.taxTreatment ?? '')}</Fact>
          <Fact label="Last rate">{about.lastRatePaise === 0 ? 'never sold to this party' : formatPaise(about.lastRatePaise)}</Fact>
          <Fact label="List">{formatPaise(about.listRatePaise)}</Fact>
        </>
      )}

      <span className="flex-1" />

      {!showsProfit ? null : (
        <span className="flex shrink-0 items-baseline gap-2">
          <span className="text-ink-muted">{onItemRow ? 'This line' : 'This bill'}</span>
          <span className="font-label text-ink">{formatPaise(shown.profitPaise)}</span>
          {shown.percent === null ? null : <span className="text-ink-muted">{shown.percent.toFixed(1)}%</span>}
          {/* A loss reads through the minus sign and the word. A strip that is green all day has
              no red left for the line actually being sold at a loss. */}
          {shown.profitPaise < 0 ? <span className="font-label text-ink">at a loss</span> : null}
        </span>
      )}
    </div>
  )
}
