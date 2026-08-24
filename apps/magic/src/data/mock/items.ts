import type { Item } from '../schema/item'

const KINDS = ['Steel rod', 'Copper wire', 'PVC pipe', 'Brass fitting', 'Cement bag', 'Plywood sheet']
const SIZES = ['6mm', '8mm', '10mm', '12mm', '16mm', '20mm', '25mm']

const PIECES = [
  { code: 'PCS', label: 'Pieces' },
  { code: 'BOX', label: 'Box' },
]

// Deterministic on purpose. A mock world that changes between runs makes a visual snapshot
// worthless and a failing test impossible to reproduce.
function priceFor(index: number) {
  return 5000 + ((index * 3767) % 250000)
}

/** Which index gets which treatment. Sparse on purpose: three lines in eleven are not ordinary
 * taxable goods, which is roughly what a wholesale ledger looks like and is enough for every
 * row of the summary to appear on a normal invoice. */
const TREATMENTS: Record<number, Item['taxTreatment']> = { 2: 'nil', 6: 'exempt', 9: 'zeroRated' }

export const items: Item[] = KINDS.flatMap((kind, kindIndex) =>
  SIZES.map((size, sizeIndex) => {
    const index = kindIndex * SIZES.length + sizeIndex
    // Every fifth item is sold loose, with no unit at all — the case that makes quantity
    // default to nothing instead of one.
    const loose = index % 5 === 4
    return {
      id: `item-${index}`,
      name: `${kind} ${size}`,
      alias: `${kind.split(' ')[0]?.slice(0, 2).toUpperCase()}${size.replace('mm', '')}`,
      barcode: String(89012340000 + index),
      units: loose ? [] : PIECES,
      defaultUnit: loose ? null : 'PCS',
      pricePaise: priceFor(index),
      // Margins that vary the way a real catalogue's do, including two lines sold AT A LOSS —
      // the case the strip exists to catch, and the one a mock of comfortable margins never
      // shows anybody.
      costPaise: Math.round(priceFor(index) * (index % 13 === 5 ? 1.08 : 0.55 + ((index % 7) * 0.05))),
      // Real-looking codes for the six kinds. Steel is 7214, copper 7408, PVC 3917, brass 7419,
      // cement 2523, plywood 4412 — close enough to be recognised by anybody who files returns.
      hsn: (['7214', '7408', '3917', '7419', '2523', '4412'] as const)[kindIndex] ?? '9999',
      // Last time is usually a little under the list, sometimes over. One in nine has never been
      // sold to this customer at all, which is the case the strip has to say something about.
      lastRatePaise: index % 9 === 4 ? 0 : Math.round(priceFor(index) * (0.94 + ((index % 5) * 0.03))),
      listRatePaise: priceFor(index),
      // A little above the list price, the way a printed maximum usually is.
      mrpPaise: Math.round(priceFor(index) * 1.15),
      // The four treatments, seeded so the tax summary has all of them to show. v2 left nil,
      // exempt and zero-rated out entirely because every row would have read as a dash — so
      // nobody ever saw the part of the summary a return actually needs.
      taxTreatment: TREATMENTS[index % 11] ?? 'taxable',
      taxPercent: TREATMENTS[index % 11] !== undefined ? 0 : index % 3 === 0 ? 18 : index % 3 === 1 ? 12 : 5,
      // Cess sits on a handful of goods and nothing else. One item in seven carries it.
      cessPercent: index % 7 === 3 ? 12 : 0,
      stock: (index * 37) % 900,
    }
  }),
)
