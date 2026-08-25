// E-Way Bill and E-Invoice — the two switches, drawn once and shown in two rooms.
//
// ONE COMPONENT BECAUSE THEY ARE ONE PAIR (Aj, 25-08). They sit in the action bar and again in
// the transport drawer, and neither place holds its own copy of the answer: both read and write
// the store. A switch that is on downstairs and off upstairs is the worst kind of control,
// because both of them look right and one of them is lying.
//
// IT TOOK ITS OWN FILE BECAUSE A GATE SAID SO, and the gate was right. The chip's class run
// appeared in both files the moment the drawer grew its pair — "no run of classes over sixty
// characters appears in more than one file", which is the drift rule catching exactly what it is
// for: two places drawing one thing, about to part.
//
// ON AT SAVE MEANS GENERATED AT SAVE, and what actually gets sent is `pending`. Whether a document
// NEEDS one of these is the portal's answer, told to the backend, and no front end can work it
// out — so the switch carries an intention. See SaveInvoice.tsx.

import { Toggle } from '@busy/ui/Toggle'

import { useInvoice } from './store'

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-control items-center rounded-control border border-stroke px-3 text-sm text-ink-secondary">
      {children}
    </span>
  )
}

export function ComplianceSwitches() {
  const eWayBill = useInvoice((state) => state.eWayBill)
  const eInvoice = useInvoice((state) => state.eInvoice)
  const setEWayBill = useInvoice((state) => state.setEWayBill)
  const setEInvoice = useInvoice((state) => state.setEInvoice)

  return (
    <>
      <Chip>
        <Toggle checked={eWayBill} onCheckedChange={setEWayBill}>
          E-Way Bill
        </Toggle>
      </Chip>
      <Chip>
        <Toggle checked={eInvoice} onCheckedChange={setEInvoice}>
          E-Invoice
        </Toggle>
      </Chip>
    </>
  )
}
