// Whether there is a Due field at all, and what is in it. Pure: no React, no store, no DOM.
//
// NAMED `dueFieldState` AND NOT `dueField`, because `DueField.tsx` is the field itself — and two
// files whose names differ only in their first letter's case are ONE file on a Mac and two on a
// Linux runner, which is a build that is green here and red in CI.
//
// IT IS NOT A FIELD UNTIL IT HAS A REASON TO BE (Aj, 25-08). Five states, and the first two are
// the ones a screen usually gets wrong by drawing an empty box:
//
//   no party            no field at all — not empty, not disabled, ABSENT
//   pays at the counter no field either: a due date on a counter sale is a question with no answer
//   party with terms    the field appears, filled from the party's own credit days
//   party, no terms     the field appears, filled from the company's default
//   neither             the field appears, empty and editable
//
// ABSENT RATHER THAN DISABLED IS THE WHOLE POINT. A disabled field is a promise that it will work
// once you do something, and there is nothing to do — the party has no terms because the sale is
// settled where it stands. A greyed box invites people to hunt for the switch that turns it on.
//
// PURE, SO THE FIVE CAN BE ASKED WITHOUT A SCREEN. Every one of them is a different thing being
// absent, and a component test would have to build five parties to find that out.

import { daysAfter } from '../../lib/day'

export type DueFieldState =
  | { shown: false; because: 'no party' | 'pays at the counter' }
  | { shown: true; value: string; from: 'the party' | 'the company default' | 'nobody' }

export function dueFieldFor({
  party,
  invoiceDate,
  companyDefaultDays,
}: {
  party: { paysAtCounter: boolean; creditDays: number } | null
  invoiceDate: string
  /** What the company gives a party who has agreed nothing. Null when the company has no default
   * either, which is a real answer and the reason the last state exists. */
  companyDefaultDays: number | null
}): DueFieldState {
  if (party === null) return { shown: false, because: 'no party' }
  if (party.paysAtCounter) return { shown: false, because: 'pays at the counter' }

  // ZERO DAYS IS "NOTHING AGREED", NOT "DUE TODAY". The party schema has said so since it was
  // written, and reading it as a term would put every invoice to a new customer due on the day it
  // was raised — which is a promise about payment nobody made.
  if (party.creditDays > 0) {
    return { shown: true, value: daysAfter(invoiceDate, party.creditDays), from: 'the party' }
  }
  if (companyDefaultDays !== null) {
    return { shown: true, value: daysAfter(invoiceDate, companyDefaultDays), from: 'the company default' }
  }
  return { shown: true, value: '', from: 'nobody' }
}
