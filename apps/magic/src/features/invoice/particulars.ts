// THE INVOICE'S PARTICULARS: its series and number, its date, and when it is due.
//
// NOT `headerFields.ts`, and the reason is worth the line: this machine's filesystem does not
// tell `headerFields.ts` and `HeaderFields.tsx` apart, so the component importing the slice
// resolved to itself and the build died. The same trap `settingsCatalogue.ts` was renamed out
// of. A slice and the thing that draws it need names that differ by more than a capital.
//
// Its own slice because none of it is about the ROWS, which is what the store's main file is
// about — the same reason the note and the charges have theirs.
//
// THE NUMBER IS A PREVIEW UNTIL IT IS SAVED. It comes from the adapter, which asks the series;
// what the invoice finally keeps is what `saveInvoice` returns. A front end that works out its
// own number is two people being shown 4/2026-27 at the same moment.
//
// AUTO IS A STATE OF THE NUMBER, NOT A SEPARATE SWITCH. Typing over the number turns it off,
// because that is what typing over it MEANS — and a switch you have to find and press after
// typing is a switch people forget, leaving the number they typed replaced on save.

import { today } from '../../lib/day'

export type Particulars = {
  /** Which book this invoice is written in. Changing it asks for a new number. */
  series: string
  /** As shown. Empty until the adapter answers, so nothing invents one for a frame. */
  number: string
  /** True while the number is the one the series gave. Typing over it makes it false. */
  numberAuto: boolean
  /** ISO. A new invoice opens on today as the calendar on the wall says it. */
  date: string
  /** ISO, or empty for none. Not every invoice has a due date — a cash sale has none, and an
   * empty field says that better than today's date pretending to be a term. */
  dueDate: string
  setSeries: (series: string) => void
  /** The adapter's answer, which does not touch a number somebody has typed. */
  offerNumber: (number: string) => void
  setNumber: (number: string) => void
  setDate: (date: string) => void
  setDueDate: (dueDate: string) => void
}

// It takes an updater as well as a plain change, because one of these has to read what is
// already there — offering a number must not overwrite a typed one.
type Apply = (change: Partial<Particulars> | ((state: Particulars) => Partial<Particulars>)) => void

export function particulars(set: Apply): Particulars {
  return {
    series: 'Main',
    number: '',
    numberAuto: true,
    date: today(),
    dueDate: '',
    setSeries: (series) => set({ series }),
    // IT DOES NOT OVERWRITE A TYPED NUMBER. The answer arrives after the screen has drawn, so
    // somebody quick enough to type over the number would have watched it replaced under them.
    offerNumber: (number) => set((state) => (state.numberAuto ? { number } : {})),
    setNumber: (number) => set({ number, numberAuto: false }),
    setDate: (date) => set({ date }),
    setDueDate: (dueDate) => set({ dueDate }),
  }
}
