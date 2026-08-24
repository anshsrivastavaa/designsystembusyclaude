// Why there is nothing here, and the way out.
//
// FOUR CAUSES, FOUR HEADINGS. Both reference builds print "No invoice exists." whatever the
// reason, which is wrong two times in three: the invoices do exist, your filters are hiding
// them. A person who reads "no invoice exists" believes the book is empty and goes looking for
// the problem somewhere else entirely.
//
// The way out is a button, not an instruction. "Try changing your filters" is a sentence; a
// Clear filters button is the thing itself.
//
// THE FOURTH CAUSE IS THE PERIOD, AND IT IS THE ONE THAT WILL BITE. The listing opens on the
// current financial year and reads the real clock, while the sample book is written around a
// fixed day. The first time somebody opens this after the book's year ends — 1 April 2027, or
// any earlier date if the mock is not moved — every invoice falls outside the period and the
// screen says nothing matches the filters. Whoever sees it will go looking for a bug in the
// filters, because that is what the screen told them. So when the period is empty and the book
// is not, it says which, and offers the period that shows everything.

import { Button } from '@busy/ui/Button'
import { useListing } from './store'

/** Written as a joined sentence rather than a template literal on purpose: the check that every
 * utility class in the source is one Tailwind builds reads long template strings as class lists,
 * and it read this prose as three classes it could not find. Prose in a component belongs in a
 * named function anyway — it is the thing a person reads. */
function outsideThePeriod(count: number): string {
  const many = count === 1 ? 'is 1 invoice' : 'are ' + String(count) + ' invoices'
  return 'There ' + many + ' in this book, all of them outside the dates you are looking at.'
}

export function ListingEmpty({ anyInvoices }: { anyInvoices: boolean }) {
  const search = useListing((state) => state.search)
  const invoices = useListing((state) => state.invoices)
  const rangeId = useListing((state) => state.rangeId)
  const setSearch = useListing((state) => state.setSearch)
  const setRange = useListing((state) => state.setRange)
  const clearEverything = useListing((state) => state.clearEverything)

  if (!anyInvoices) {
    return (
      <Message
        heading="No invoices yet"
        detail="The first one you raise will appear here."
      />
    )
  }

  // The book has invoices and the period has none. Say that, rather than blaming the filters.
  if (search === '' && rangeId !== 'allTime' && invoices.length > 0) {
    return (
      <Message
        heading="Nothing in this period"
        detail={outsideThePeriod(invoices.length)}
      >
        <Button variant="ghost" onClick={() => setRange('allTime')}>
          Show all time
        </Button>
      </Message>
    )
  }

  if (search !== '') {
    return (
      <Message heading={`Nothing matches “${search}”`} detail="Search looks at the invoice number and the party name.">
        <Button variant="ghost" onClick={() => setSearch('')}>
          Clear the search
        </Button>
      </Message>
    )
  }

  return (
    <Message heading="No invoices match these filters" detail="The chips above the table say what is narrowing the list.">
      <Button variant="ghost" onClick={clearEverything}>
        Clear filters
      </Button>
    </Message>
  )
}

function Message({ heading, detail, children }: { heading: string; detail: string; children?: React.ReactNode }) {
  return (
    <div className="px-4 py-12 text-center">
      <h3 className="text-lg font-strong text-ink">{heading}</h3>
      <p className="mt-1 text-body text-ink-secondary">{detail}</p>
      {children === undefined ? null : <div className="mt-4">{children}</div>}
    </div>
  )
}
