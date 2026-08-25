// Where the goods are going, and the two compliance switches.
//
// IN THE STORE AND NOT IN THE DRAWER, and that move is what makes the rest of region four
// possible. The drawer held its own draft, so nothing outside it could ask whether transport was
// filled in — and "turning E-Way on opens the drawer for whatever is missing" is a question
// asked by the ACTION BAR, which is nowhere near the drawer. A drawer that is the only thing
// that knows what it holds cannot be asked about it.
//
// THE TWO SWITCHES ARE HERE FOR THE SAME REASON, one step further on. They are drawn in the
// action bar and again in the transport drawer — the same two switches seen from two rooms — and
// neither may hold its own copy, or turning E-Way on downstairs leaves it off upstairs.

/** Which fields an E-Way Bill cannot be raised without.
 *
 * ONE LIST, AND IT IS A GUESS UNTIL SOMEBODY RULES ON IT. Nothing in the product document or in
 * v2 says which transport fields are mandatory, so this is the set the portal actually refuses
 * without in the common road case: who is carrying it, in what, and how far. It is named here and
 * used in exactly one place, so when the ruling arrives it is one edit. The question is filed in
 * `docs/for-stakeholders.md`.
 *
 * NOT the transporter ID or the lorry receipt: both are optional on a road consignment, and a
 * screen that refuses to save without them is a screen inventing a rule. */
const E_WAY_NEEDS = ['transporter', 'vehicle', 'distance'] as const

export type TransportDetails = {
  shipName: string
  shipAddress: string
  shipGstin: string
  shipPin: string
  transporter: string
  transporterId: string
  vehicle: string
  mode: string
  distance: string
  lorryReceipt: string
  dispatchFrom: string
  /** Shipping somewhere other than the party's own address. */
  shipSeparately: boolean
}

export const MODES = ['Road', 'Rail', 'Air', 'Ship']

const BLANK: TransportDetails = {
  shipName: '', shipAddress: '', shipGstin: '', shipPin: '',
  transporter: '', transporterId: '', vehicle: '', mode: MODES[0]!, distance: '', lorryReceipt: '',
  dispatchFrom: '', shipSeparately: false,
}

/** Whether an E-Way Bill could be raised from what is on the invoice now. Asked by the action
 * bar, answered from the store — which is the whole reason the draft moved out of the drawer. */
export function eWayIsFilled(details: TransportDetails): boolean {
  return E_WAY_NEEDS.every((field) => details[field].trim() !== '')
}

export type Transport = {
  transport: TransportDetails
  setTransport: (field: keyof TransportDetails, value: string) => void
  setShipSeparately: (separate: boolean) => void
  /** ON AT SAVE MEANS GENERATED AT SAVE. Nothing on this screen can work out whether a document
   * NEEDS one — that is the portal's answer, told to the backend — so what these carry is an
   * intention and the status they send is `pending`. */
  eWayBill: boolean
  eInvoice: boolean
  setEWayBill: (on: boolean) => void
  setEInvoice: (on: boolean) => void
}

type State = Pick<Transport, 'transport' | 'eWayBill' | 'eInvoice'>
type Apply = (change: Partial<State> | ((state: State) => Partial<State>)) => void

export function transport(set: Apply): Transport {
  return {
    transport: BLANK,
    eWayBill: false,
    eInvoice: false,
    setTransport: (field, value) =>
      set((state) => ({ transport: { ...state.transport, [field]: value } })),
    setShipSeparately: (shipSeparately) =>
      set((state) => ({ transport: { ...state.transport, shipSeparately } })),
    setEWayBill: (eWayBill) => set({ eWayBill }),
    setEInvoice: (eInvoice) => set({ eInvoice }),
  }
}
