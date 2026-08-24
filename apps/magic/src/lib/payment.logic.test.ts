// The one question, asked once. These cases lived in two files answering it two ways, and the
// pair that matters most is the last two: an invoice can be part paid AND late at once, and the
// single word it is CALLED cannot say both. The listing's old copy called it overdue and you
// could not tell there was money against it.

import { describe, it, expect } from 'vitest'

import { balanceOf, isCancelled, paymentStateOf } from './payment'

const TODAY = '2026-08-20'
const invoice = (over: Partial<Parameters<typeof paymentStateOf>[0]> = {}) => ({
  totalPaise: 100000,
  paidPaise: 0,
  dueDate: '2026-09-19',
  cancelledAt: null,
  ...over,
})

describe('what an invoice is called', () => {
  it('calls one with nothing received pending', () => {
    expect(paymentStateOf(invoice(), TODAY)).toEqual({ status: 'pending', balancePaise: 100000, partPaid: false })
  })

  it('calls one with some received on account, and says what is left', () => {
    const part = paymentStateOf(invoice({ paidPaise: 40000 }), TODAY)
    expect(part.status).toBe('onAccount')
    expect(part.balancePaise).toBe(60000)
  })

  it('calls one with everything received paid', () => {
    expect(paymentStateOf(invoice({ paidPaise: 100000 }), TODAY).status).toBe('paid')
  })

  it('calls one paid late paid, not overdue — settled beats late', () => {
    expect(paymentStateOf(invoice({ paidPaise: 100000, dueDate: '2026-02-08' }), TODAY).status).toBe('paid')
  })

  it('says cancelled and nothing else, whatever was received', () => {
    const dead = paymentStateOf(invoice({ paidPaise: 40000, cancelledAt: '2026-07-29' }), TODAY)
    expect(dead).toEqual({ status: 'cancelled', balancePaise: 0, partPaid: false })
  })
})

describe('whether it is late', () => {
  it('is not overdue on the due date itself — you have until the end of the day', () => {
    expect(paymentStateOf(invoice({ dueDate: TODAY }), TODAY).status).toBe('pending')
  })

  it('is overdue the day after', () => {
    expect(paymentStateOf(invoice({ dueDate: '2026-08-19' }), TODAY).status).toBe('overdue')
  })

  // THE CASE THE OLD LISTING COPY COULD NOT ANSWER. It returned one word, so a part-paid late
  // invoice came back as 'overdue' and the money already against it was invisible. Late still
  // wins the word, because Overdue is what gets an invoice chased — and partPaid carries what
  // the word drops.
  it('is called overdue when it is part paid and late, and still says it is part paid', () => {
    const late = paymentStateOf(invoice({ paidPaise: 10000, dueDate: '2026-03-13' }), TODAY)
    expect(late.status).toBe('overdue')
    expect(late.partPaid).toBe(true)
    expect(late.balancePaise).toBe(90000)
  })
})

describe('what is still owed', () => {
  it('is nothing on a cancelled invoice — it keeps its total for the record', () => {
    const dead = invoice({ totalPaise: 96000, cancelledAt: '2026-07-29' })
    expect(dead.totalPaise).toBe(96000)
    expect(balanceOf(dead)).toBe(0)
    expect(isCancelled(dead)).toBe(true)
  })

  // An overpayment is not a smaller debt. It is a credit to the PARTY, and it belongs on the
  // party's account rather than hidden inside one invoice as a negative receivable.
  it('never goes negative when more was received than was owed', () => {
    expect(balanceOf(invoice({ paidPaise: 120000 }))).toBe(0)
    expect(paymentStateOf(invoice({ paidPaise: 120000 }), TODAY).status).toBe('paid')
  })
})
