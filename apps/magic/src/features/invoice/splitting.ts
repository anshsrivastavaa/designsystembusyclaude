// Whether this invoice is split, and into what.
//
// IN THE STORE because four surfaces ask about it and none of them is the drawer: the due-date
// field reads "Multiple", the breakdown's door says how many parts, settlement shows the summary,
// and the item grid refuses a new line. A drawer that is the only thing that knows what it holds
// cannot be asked about it — the transport drawer had exactly that fault a day ago.

import { spread, type SplitPart, type SplitPlan } from './splitSchedule'

export type Splitting = {
  /** Empty means the invoice is not split. One representation, so nothing can be split into
   * nothing — and the due-date field reads "Multiple" off the same fact the grid refuses on. */
  splitParts: readonly SplitPart[]
  /** What the top row asks for. Kept even while the table is hand-edited, so the numbers a person
   * typed into it stay on the screen rather than snapping back to the last generated plan. */
  splitPlan: SplitPlan
  /** Somebody has edited a row, so the generator no longer owns the table. Taken from v2, which
   * has no generator at all: a hand-made schedule is never re-spread. See splitSchedule.ts. */
  splitTouched: boolean
  /** Re-spread from the top row. Does nothing once a row has been touched. */
  planSplit: (plan: Partial<SplitPlan>, totalPaise: number) => void
  setPartAmount: (id: string, paise: number) => void
  setPartDue: (id: string, due: string) => void
  addPart: (due: string) => void
  removePart: (id: string) => void
  /** Take the split off. The invoice goes back to one due date and accepts lines again. */
  clearSplit: () => void
  /** Bumped when something asks for the schedule to be opened. THE SAME SHAPE AS `cursorClaim`,
   * and for the same reason: the thing that asks and the thing that opens are in different
   * regions. The due-date field is the split's READ-BACK and it sits in the header; the drawer
   * belongs beside the total, because that is where the door is. Threading a callback from the
   * screen down through the party header to reach a drawer in the footer would be a prop crossing
   * the whole invoice to join two things that already share this store. */
  splitAsked: number
  askForSplit: () => void
}

type State = Pick<Splitting, 'splitParts' | 'splitPlan' | 'splitTouched' | 'splitAsked'>
type Apply = (change: Partial<State> | ((state: State) => Partial<State>)) => void

export function splitting(set: Apply): Splitting {
  return {
    splitParts: [],
    splitPlan: { parts: 2, startDate: '', gapDays: 30 },
    splitTouched: false,
    splitAsked: 0,

    planSplit: (plan, totalPaise) =>
      set((state) => {
        const next = { ...state.splitPlan, ...plan }
        // THE TOP ROW STILL MOVES, THE TABLE DOES NOT. Freezing the inputs as well would leave a
        // person unable to correct a start date they mistyped; what is protected is the figures
        // they agreed with a customer, not the controls.
        if (state.splitTouched) return { splitPlan: next }
        return { splitPlan: next, splitParts: spread(totalPaise, next) }
      }),

    setPartAmount: (id, paise) =>
      set((state) => ({
        splitTouched: true,
        splitParts: state.splitParts.map((part) =>
          part.id === id ? { ...part, amountPaise: Math.max(0, paise) } : part,
        ),
      })),

    setPartDue: (id, due) =>
      set((state) => ({
        splitTouched: true,
        splitParts: state.splitParts.map((part) => (part.id === id ? { ...part, due } : part)),
      })),

    // A PART ADDED BY HAND CARRIES NOTHING, on purpose. Spreading the total again to make room for
    // it would rewrite every figure already agreed, which is the thing the touched rule exists to
    // stop — so the new part starts at zero and the shortfall says what is left to place.
    addPart: (due) =>
      set((state) => ({
        splitTouched: true,
        splitParts: [...state.splitParts, { id: `part-added-${state.splitParts.length}`, amountPaise: 0, due }],
      })),

    removePart: (id) =>
      set((state) => ({ splitTouched: true, splitParts: state.splitParts.filter((part) => part.id !== id) })),

    clearSplit: () => set({ splitParts: [], splitTouched: false }),
    askForSplit: () => set((state) => ({ splitAsked: state.splitAsked + 1 })),
  }
}
