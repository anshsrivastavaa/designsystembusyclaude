// The two compliance switches: what they send, and what turning E-Way on does when the transport
// details are empty.
//
// BOTH WERE HARD-CODED TO `notRequired` UNTIL 25-08. The switches rendered, moved, and changed
// nothing at all about the invoice that got saved — the quietest kind of dead control, because it
// answers every press correctly and lies about the result. So the check is on the DRAFT that
// reaches the adapter, which is the only place the difference exists.

import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { data } from '../../data/source'
import { emptyRow } from '../../data/schema/invoice'
import type { Invoice, InvoiceDraft } from '../../data/schema/invoice'
import type { Party } from '../../data/schema/party'
import { useInvoice } from './store'
import { SaveInvoice } from './SaveInvoice'

let host: HTMLDivElement
let sent: InvoiceDraft[]
let transportOpened: number

const someone: Party = {
  id: 'party-1', name: 'Sharma Traders', mobile: '', gstin: '', city: 'Indore',
  outstandingPaise: 0, trustGrade: 'A', creditLimitPaise: 0, creditDays: 30, overduePaise: 0, paysAtCounter: false,
  gstinStatus: 'active',
}

beforeEach(async () => {
  host = document.createElement('div')
  document.body.append(host)
  sent = []
  transportOpened = 0
  // THE DRAFT IS WHAT THIS FILE IS ABOUT, so the adapter is stood in for and the draft is kept.
  // What comes back ECHOES the draft rather than being invented: the two compliance statuses are
  // handed straight back, which is what a real backend does with them, so nothing in the assertion
  // below is reading a value this test made up.
  //
  // A REFUSAL CANNOT BE RETURNED HERE, and that is the schema layer working. `Refusal` carries a
  // brand no component can name and `refuse` is import-restricted, so only the adapter can make
  // one — which is exactly the rule that stops a screen inventing "no".
  vi.spyOn(data, 'saveInvoice').mockImplementation(async (draft) => {
    sent.push(draft)
    const answer: Invoice = {
      id: 'saved', number: 'TEST/1', date: '2026-08-25', dueDate: '2026-09-24',
      taxablePaise: 0, taxPaise: 0, partyId: draft.partyId, partyName: draft.partyName,
      totalPaise: 0, paidPaise: 0, cancelledAt: null,
      eInvoiceStatus: draft.eInvoiceStatus, eWayBillStatus: draft.eWayBillStatus,
      rows: draft.rows,
    }
    return answer
  })
  useInvoice.getState().reset()
  useInvoice.getState().chooseParty(someone)
  useInvoice.getState().load([{ ...emptyRow('row-0'), itemId: 'item-0', itemName: 'Bolt', quantity: 1, pricePaise: 100_00, amountPaise: 100_00 }])
  mounted(host, <SaveInvoice onOpenTransport={() => { transportOpened += 1 }} />)
  // Waited for, not assumed. Without this the FIRST test in the file pressed Save before the bar
  // was on the screen and the rest passed, which is the shape of flake that trains people to
  // re-run instead of read.
  await settled(() => document.querySelector('[aria-label="Invoice actions"]') !== null)
})

afterEach(() => {
  vi.restoreAllMocks()
  unmountAll()
  host.remove()
  useInvoice.getState().reset()
})

const save = async () => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find((one) => one.textContent?.includes('Save'))!
  button.click()
  await settled()
}

it('sends notRequired for both switches while both are off', async () => {
  await save()
  await settled(() => sent.length > 0)
  expect(sent[0]?.eInvoiceStatus).toBe('notRequired')
  expect(sent[0]?.eWayBillStatus).toBe('notRequired')
})

it('sends pending for E-Invoice the moment its switch is on', async () => {
  // PENDING AND NOT GENERATED. Whether a document needs one of these is the portal's answer, told
  // to the backend; no front end can work it out. On means "raise it".
  useInvoice.getState().setEInvoice(true)
  await settled()
  await save()
  await settled(() => sent.length > 0)
  expect(sent[0]?.eInvoiceStatus).toBe('pending')
})

it('opens the transport drawer instead of saving when E-Way is on and the details are empty', async () => {
  useInvoice.getState().setEWayBill(true)
  await settled()
  await save()
  expect(transportOpened).toBe(1)
  // AND THE INVOICE IS UNTOUCHED BEHIND IT. The answer to "you cannot do that" is the place the
  // answers go, not a half-saved invoice.
  expect(sent).toHaveLength(0)
  expect(document.body.textContent).toContain('An E-Way Bill needs')
})

it('saves and sends pending once the transport details are filled in', async () => {
  useInvoice.getState().setEWayBill(true)
  useInvoice.getState().setTransport('transporter', 'Balaji Roadlines')
  useInvoice.getState().setTransport('vehicle', 'MP09 AB 1234')
  useInvoice.getState().setTransport('distance', '420')
  await settled()
  await save()
  await settled(() => sent.length > 0)
  expect(transportOpened).toBe(0)
  expect(sent[0]?.eWayBillStatus).toBe('pending')
})
