// The full filter set, in the one Drawer.
//
// MOST OF IT IS NOT ON OFFER YET, AND IT SAYS SO. The product document lists twenty advanced
// filters — GSTIN, PAN, city, state, contact person, mobile, email, payment type, salesperson,
// warehouse, attachment. Every one of those reads a field the invoice header does not carry:
// the header has a number, two dates, a party, two amounts and a cancelled marker, and that is
// all a listing is given. They are listed here, switched off, each saying what it is waiting
// for — because a filter panel that silently omits eleven of its filters looks finished, and
// somebody signs it off as finished.
//
// THREE LAYERS, AND NOTHING IS IN TWO OF THEM. The compliance ticks were in here as well as on
// the screen above the table. They are on screen, so they are not here: two controls for one
// filter is a person wondering which is the real one.

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { TextField } from '@busy/ui/TextField'
import { useListing } from './store'

/** The filters the document asks for that no field on the invoice can answer yet, and the
 * field each is waiting for. Shown rather than hidden, so the gap is visible to whoever signs
 * this off instead of being discovered by the dev team six weeks later. */
const WAITING: { label: string; needs: string }[] = [
  { label: 'Party GSTIN', needs: 'the party GSTIN on the invoice' },
  { label: 'PAN', needs: 'the party PAN on the invoice' },
  { label: 'City', needs: 'the party address on the invoice' },
  { label: 'State', needs: 'the party address on the invoice' },
  { label: 'Contact person', needs: 'the party contact on the invoice' },
  { label: 'Mobile', needs: 'the party contact on the invoice' },
  { label: 'Email', needs: 'the party contact on the invoice' },
  { label: 'Payment type', needs: 'a payment type on the invoice' },
  { label: 'Salesperson', needs: 'a salesperson on the invoice' },
  { label: 'Warehouse', needs: 'a warehouse on the invoice' },
  { label: 'Attachment', needs: 'an attachment marker on the invoice' },
]

export function AdvancedFilters({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useListing()

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Advanced filters"
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={state.clearEverything}>
            Clear all
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <section>
          <h3 className="mb-2 text-body font-label text-ink">Invoice</h3>
          <label className="mb-1 block text-sm text-ink-secondary" htmlFor="advanced-number">
            Invoice number
          </label>
          <div className="h-control rounded-control border border-stroke">
            <TextField
              id="advanced-number"
              value={state.search}
              placeholder="Any number"
              onChange={(event) => state.setSearch(event.target.value)}
            />
          </div>

          <label className="mt-3 mb-1 block text-sm text-ink-secondary" htmlFor="advanced-party">
            Party name
          </label>
          <div className="h-control rounded-control border border-stroke">
            <TextField
              id="advanced-party"
              value={state.party ?? ''}
              placeholder="Any party"
              onChange={(event) => state.setParty(event.target.value || null)}
            />
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-body font-label text-ink">Waiting on the backend</h3>
          <p className="mb-2 text-sm text-ink-secondary">
            The product document asks for these. Each needs a field the invoice does not carry
            yet, so each is switched off rather than quietly missing.
          </p>
          {WAITING.map((filter) => (
            <div key={filter.label} className="flex items-baseline justify-between gap-4 border-b border-stroke py-2 last:border-b-0">
              <span className="text-body text-ink-muted">{filter.label}</span>
              <span className="text-right text-sm text-ink-muted">Needs {filter.needs}</span>
            </div>
          ))}
        </section>
      </div>
    </Drawer>
  )
}
