// The note on the invoice, what has been received against it, and whether this user may see
// margins.
//
// Its own slice because the store had grown past its line again and these three genuinely
// belong together: none of them is about the ROWS, which is what the rest of that file is
// about. They are things the invoice carries.

export type NoteAndRights = {
  /** The note, and whether the customer's copy shows it. */
  narration: string
  narrationPrinted: boolean
  /** What has already been received. Zero on a new invoice; a loaded one brings its own, which
   * is what lets the arithmetic say "partly paid" rather than a screen deciding it. */
  paidPaise: number
  /** Whether this user may see margins. A RIGHT, not a setting: it comes with the person, and
   * the strip is absent rather than hidden without it. `?owner` stands in until real rights. */
  showsProfit: boolean
  setNarration: (text: string) => void
  setNarrationPrinted: (printed: boolean) => void
  /** What the settlement panel decided has arrived — credits adjusted plus money taken now.
   *
   * IT WRITES THE SAME FIELD A LOADED INVOICE BRINGS, on purpose. "Partly paid · balance X" and
   * the Paid tab are both worked out from `paidPaise`, and a settlement that kept its own total
   * somewhere else would be a second answer to "how much has arrived" — with the chip reading
   * one and the panel the other. */
  setPaidPaise: (paise: number) => void
}

type Apply = (change: Partial<NoteAndRights>) => void

export function noteAndRights(set: Apply): NoteAndRights {
  return {
    narration: '',
    // PRINTED IS THE DEFAULT. A note nobody outside can see is the special case; the commonest
    // narration is a delivery instruction or a reference the customer needs.
    narrationPrinted: true,
    paidPaise: 0,
    showsProfit: typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('owner'),
    setNarration: (narration) => set({ narration }),
    setNarrationPrinted: (narrationPrinted) => set({ narrationPrinted }),
    setPaidPaise: (paidPaise) => set({ paidPaise: Math.max(0, paidPaise) }),
  }
}
