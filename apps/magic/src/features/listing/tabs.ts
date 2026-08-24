// Which states get a tab on this listing.
//
// The states themselves are the product's, and live in lib/payment.ts. WHICH of them earn a tab
// across the top of this one screen is this screen's decision and nobody else's — the invoice
// will ask the same question of the same five words and answer it differently, or not at all.
// Keeping the choice here is what stops the shared model growing a listing-shaped opinion.
//
// Paid and Cancelled are deliberately not tabs: nobody hunts for a paid invoice, and a
// cancelled one is something you come across rather than go looking for. Both still appear
// under All, so neither is hidden.

import type { InvoiceStatus } from '../../lib/payment'

export const TAB_STATUSES: InvoiceStatus[] = ['pending', 'overdue', 'onAccount']
