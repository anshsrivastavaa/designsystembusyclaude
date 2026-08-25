import { describe, expect, it } from 'vitest'

import { runTail, tailFor, type TailStep } from './afterSave'

const none = { eInvoice: false, eWay: false, print: false, email: false, whatsapp: false }

describe('what runs after the save, and in what order', () => {
  it('runs nothing when nothing is switched on', () => {
    expect(tailFor(none)).toEqual([])
  })

  it('keeps the ruled order however the switches were set', () => {
    // THE TWO PORTAL POSTINGS GO FIRST. Everything after them is a copy of a document whose
    // compliance status they decide, and printing before the e-invoice is refused hands the
    // customer a piece of paper that is wrong.
    expect(tailFor({ ...none, whatsapp: true, print: true, eWay: true, eInvoice: true })).toEqual([
      'eInvoice', 'eWay', 'print', 'whatsapp',
    ])
  })
})

describe('a failure after the save', () => {
  it('runs every step while they keep working', async () => {
    const ran: TailStep[] = []
    const answer = await runTail(['eInvoice', 'print', 'email'], async (step) => {
      ran.push(step)
      return true
    })
    expect(ran).toEqual(['eInvoice', 'print', 'email'])
    expect(answer.failedAt).toBeNull()
    expect(answer.message).toBeNull()
  })

  it('stops at the first failure and does not run what comes after', async () => {
    const ran: TailStep[] = []
    const answer = await runTail(['eInvoice', 'print', 'email'], async (step) => {
      ran.push(step)
      return step !== 'print'
    })
    expect(ran).toEqual(['eInvoice', 'print'])
    expect(answer.done).toEqual(['eInvoice'])
    expect(answer.failedAt).toBe('print')
  })

  it('says the invoice is safe, because otherwise the operator saves it again', async () => {
    const answer = await runTail(['print'], async () => false)
    expect(answer.message).toContain('Saved')
    expect(answer.message).toContain('printing')
    expect(answer.message).toContain('do not save it again')
  })
})
