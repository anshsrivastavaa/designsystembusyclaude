// Putting an invoice aside and bringing it back.
//
// THE ROUND TRIP IS THE TEST. Holding an invoice and getting a message back proves nothing on its
// own — what matters is that what comes back is what went in, including the parts that have been
// dropped on the floor before: the charges, the note and the rounding.

import { afterEach, beforeEach, expect, it } from 'vitest'

import { mounted, unmountAll } from '@busy/ui/mounted'
import { settled } from '@busy/ui/settled'
import '../../index.css'
import { emptyRow } from '../../data/schema/invoice'
import type { Party } from '../../data/schema/party'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { useInvoice } from './store'
import { SaveInvoice } from './SaveInvoice'

let host: HTMLDivElement

const someone: Party = {
  id: 'party-1', name: 'Sharma Traders', mobile: '', gstin: '', city: 'Indore',
  outstandingPaise: 0, trustGrade: 'A', creditLimitPaise: 0, creditDays: 30, overduePaise: 0, paysAtCounter: false,
  gstinStatus: 'active',
}

const aLine = () => ({
  ...emptyRow('row-0'), itemId: 'item-0', itemName: 'Bolt', quantity: 2, pricePaise: 250_00, amountPaise: 500_00,
})

/** The adapter's held list is module state and outlives a test, so each one starts from empty —
 * through the same seam the screen uses, because only `data/source.ts` may reach into the mock.
 * Without this the second test in the file was holding a SECOND invoice and every count after it
 * was one out. */
const clearHeld = async () => {
  const answer = await data.listHeld()
  if (isRefusal(answer)) return
  for (const one of answer) await data.discardHeld(one.id)
}

beforeEach(async () => {
  await clearHeld()
  host = document.createElement('div')
  document.body.append(host)
  useInvoice.getState().reset()
  mounted(host, <SaveInvoice />)
  await settled(() => document.querySelector('[aria-label="Invoice actions"]') !== null)
})

afterEach(() => {
  void clearHeld()
  unmountAll()
  host.remove()
  useInvoice.getState().reset()
})

/** Presses Hold and waits until the list the chooser reads has actually caught up.
 *
 * WAITING FOR THE MESSAGE IS NOT ENOUGH, and that is worth writing down: the bar says "put aside"
 * before the held list has been re-read, so a Ctrl+H fired on the message saw an empty list and
 * did nothing. The message is the screen reporting; the list is the state the next press acts on. */
const hold = async () => {
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find((one) => one.textContent === 'Hold')!
  button.click()
  await settled(() => document.body.textContent?.includes('aside') === true)
}

/** How many the adapter is holding, asked through the same seam the screen uses. */
const heldCount = async () => {
  const answer = await data.listHeld()
  return isRefusal(answer) ? -1 : answer.length
}

const untilHeld = async (wanted: number) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if ((await heldCount()) === wanted) return
    await settled()
  }
  throw new Error(`The adapter never reached ${wanted} held invoice(s).`)
}

it('says so rather than doing nothing when there is nothing to put aside', async () => {
  // A CONTROL THAT APPEARS TO DO NOTHING is worse than one that says why it did nothing.
  const button = [...document.querySelectorAll<HTMLButtonElement>('button')].find((one) => one.textContent === 'Hold')!
  button.click()
  await settled(() => document.body.textContent?.includes('nothing on this invoice') === true)
  expect(document.body.textContent).toContain('nothing on this invoice')
})

it('puts the invoice aside and leaves a blank one behind', async () => {
  useInvoice.getState().chooseParty(someone)
  useInvoice.getState().load([aLine()])
  useInvoice.getState().setNarration('Deliver before Friday')
  await settled()

  await hold()
  await untilHeld(1)

  // THE SCREEN IS CLEAR AFTERWARDS. Holding an invoice you are still looking at would be a
  // control that reports a state it is not in.
  expect(useInvoice.getState().party).toBeNull()
  expect(useInvoice.getState().rows.filter((row) => row.itemId !== null)).toHaveLength(0)
  expect(useInvoice.getState().narration).toBe('')
})

it('brings back everything that went in, including the note', async () => {
  useInvoice.getState().chooseParty(someone)
  useInvoice.getState().load([aLine()])
  useInvoice.getState().setNarration('Deliver before Friday')
  useInvoice.getState().setRoundOff(false)
  await settled()
  await hold()
  await untilHeld(1)
  // The chooser's own copy of the list catches up a frame after the adapter's.
  await settled()

  // Ctrl+H with exactly one held invoice brings it straight back — asking somebody to pick from a
  // list of one is a step that answers itself. A REAL key press on the document, which is where
  // the binding lives.
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true }))
  await settled(() => useInvoice.getState().party !== null)

  const back = useInvoice.getState()
  expect(back.party?.name).toBe('Sharma Traders')
  expect(back.rows.filter((row) => row.itemId !== null)).toHaveLength(1)
  expect(back.rows[0]?.amountPaise).toBe(500_00)
  // THE NOTE AND THE ROUNDING ARE THE PARTS THAT GET DROPPED. The draft used to carry the party
  // and the rows and nothing else.
  expect(back.narration).toBe('Deliver before Friday')
  expect(back.roundOffOn).toBe(false)
})

it('opens the chooser rather than guessing when more than one is held', async () => {
  for (const name of ['Sharma Traders', 'Balaji Distributors']) {
    useInvoice.getState().chooseParty({ ...someone, id: name, name })
    useInvoice.getState().load([aLine()])
    await settled()
    await hold()
  }
  await untilHeld(2)

  // PRESSED ONCE, AND ONLY AFTER THE HOOK HAS CAUGHT UP. The Ctrl+H handler decides on the HOOK's
  // copy of the held list, which is a re-read behind the adapter's — and that re-read goes through
  // the mock's deliberate two hundred milliseconds. A press a frame early sees ONE held invoice
  // and brings it straight back, which is the thing this test is asserting does not happen; the
  // first version of it retried the press and made that fault itself.
  for (let frame = 0; frame < 40; frame += 1) await settled()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true }))
  await settled(() => document.querySelector('[role="dialog"]') !== null)

  // BOTH ARE NAMED, because a row reading "held at 14:32" tells nobody which invoice it is — and
  // "the most recent" is a guess about which one they meant, which is the whole reason this opens.
  const chooser = document.querySelector<HTMLElement>('[role="dialog"]')!
  expect(chooser.textContent).toContain('Sharma Traders')
  expect(chooser.textContent).toContain('Balaji Distributors')
  expect(useInvoice.getState().party).toBeNull()
})

it('does not leave a copy behind once it has been brought back', async () => {
  useInvoice.getState().chooseParty(someone)
  useInvoice.getState().load([aLine()])
  await settled()
  await hold()
  await untilHeld(1)
  await settled()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true }))
  await settled(() => useInvoice.getState().party !== null)
  await untilHeld(0)
  await settled()

  // A held invoice you have resumed IS the invoice on the screen. A copy left behind is an
  // invoice somebody saves twice — once here and once from the chooser they forgot about.
  useInvoice.getState().reset()
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'h', ctrlKey: true, bubbles: true }))
  await settled(() => document.body.textContent?.includes('Nothing is being held') === true)
  expect(useInvoice.getState().party).toBeNull()
})
