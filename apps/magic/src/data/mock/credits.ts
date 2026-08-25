// The credits a party has sitting against them. Invented, like everything else in this folder.
//
// INVENTED ON PURPOSE AND WRITTEN DOWN AS A SHAPE. `docs/backend-assumptions.md` carries what
// the dev team has to answer with; nothing on the settlement panel waits on a real ledger.
//
// THREE KINDS OF PARTY, because a panel that only ever has money in it is a panel nobody has
// seen empty: one party with all four types, one with a single receipt, and everybody else with
// nothing at all — which is the commonest case and the one the empty state is for.

import type { Credit } from '../schema/credit'

const BY_PARTY: Record<string, Credit[]> = {
  // Balaji Distributors — the party with a full ledger behind them.
  'party-6': [
    { id: 'credit-adv-1', type: 'advance', reference: 'ADV/2026/0041', date: '2026-07-18', availablePaise: 5_000_00 },
    { id: 'credit-rec-1', type: 'receipt', reference: 'RCP/2026/0312', date: '2026-08-02', availablePaise: 12_500_00 },
    { id: 'credit-cn-1', type: 'creditNote', reference: 'CN/2026/0009', date: '2026-08-11', availablePaise: 1_840_00 },
    // On account has no document naming what it was for. That is what on account means.
    { id: 'credit-oa-1', type: 'onAccount', reference: '', date: '2026-08-19', availablePaise: 760_00 },
  ],
  'party-1': [
    { id: 'credit-rec-2', type: 'receipt', reference: 'RCP/2026/0298', date: '2026-08-09', availablePaise: 4_179_00 },
  ],
}

/** Sorted by date, oldest first — the order the panel shows them in, decided here rather than in
 * the panel so the listing and the party master read the same sequence. Oldest first because the
 * oldest credit is the one that has been sitting there longest and is the one to use up. */
export function creditsFor(partyId: string): Credit[] {
  return [...(BY_PARTY[partyId] ?? [])].sort((one, two) => one.date.localeCompare(two.date))
}
