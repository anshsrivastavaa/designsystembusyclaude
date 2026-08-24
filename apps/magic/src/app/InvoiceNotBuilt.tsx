// What you get when you open an invoice from the listing, until the screen that opens it
// exists.
//
// THE HALF THAT IS BUILT IS THE HALF THAT IS MINE. Opening a saved invoice and changing it in
// place is journey 39, and it needs the invoice screen in modify, which belongs to the session
// that owns features/invoice. What this session owed was the way in: a number on the listing
// that carries its id into the address, and back and forward that work. This is the other end
// of that, and it is deliberately a dead end that SAYS it is one.
//
// A LINK THAT SILENTLY DOES NOTHING IS THE WORSE ANSWER, and it was the state of things: the
// numbers on the listing were plain text and Enter on a row did nothing at all, so a
// stakeholder clicking one learned only that the product ignored them. A screen that names the
// invoice it was asked for, says what is missing and gives you the way back is honest, takes a
// minute to write, and is deleted whole the day modify lands.
//
// THE ID IS ON THE SCREEN ON PURPOSE. It is the one thing that proves the link carried what it
// was supposed to carry — without it "open invoice 4/2026-27" and "open invoice 9/2026-27"
// produce identical screens and the seam cannot be tested from the outside.

import { Button } from '@busy/ui/Button'

export type InvoiceNotBuiltProps = {
  /** The invoice the address asked for. Null when the address named the screen but no invoice,
   * which is a broken link rather than a missing feature — so it says a different thing. */
  invoiceId: string | null
  onBackToListing: () => void
}

export function InvoiceNotBuilt({ invoiceId, onBackToListing }: InvoiceNotBuiltProps) {
  return (
    <main className="flex min-h-0 flex-1 items-center justify-center p-4">
      <div className="max-w-prose text-center">
        <h1 className="mb-2 text-title font-strong text-ink">
          {invoiceId === null ? 'No invoice was named' : 'Opening a saved invoice is not built yet'}
        </h1>

        <p className="mb-1 text-body text-ink-secondary">
          {invoiceId === null
            ? 'The address asked for an invoice screen without saying which invoice. Nothing is wrong with your books — the link that brought you here is incomplete.'
            : 'The listing knows which invoice you asked for and the address is carrying it. What is missing is the screen that shows a saved invoice and lets you change it, which is the next thing being built.'}
        </p>

        {invoiceId === null ? null : (
          <p className="mb-4 text-body text-ink">
            You asked for <span data-role="asked-for" className="font-strong">{invoiceId}</span>.
          </p>
        )}

        <Button onClick={onBackToListing}>Back to the invoice list</Button>
      </div>
    </main>
  )
}
