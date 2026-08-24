// What an address means, and what navigating does to it.
//
// The rules that matter are the ones a naive version gets wrong: a bare address is the front
// door rather than nothing, the item-grid measuring switch implies its own screen, an explicit
// screen beats that implication so the rail can always take you home, and navigating keeps
// every other parameter — the tax mode, the owner's view, the readonly flag all ride in the
// query, and a click that quietly dropped one would change what the next screen does.

import { describe, expect, it } from 'vitest'

import { addressFor, invoiceIdFor, screenFor } from './screen'

describe('what an address asks for', () => {
  it('opens the listing on a bare address, because that is where a day starts', () => {
    expect(screenFor('')).toBe('listing')
    expect(screenFor('?')).toBe('listing')
  })

  it('opens the create screen when the address says so', () => {
    expect(screenFor('?screen=create')).toBe('create')
  })

  it('treats the grid measuring switch as the create screen on its own', () => {
    expect(screenFor('?rows=40')).toBe('create')
  })

  it('lets a named screen beat that, so the rail gets you home from a measured grid', () => {
    expect(screenFor('?rows=40&screen=listing')).toBe('listing')
  })

  it('ignores a screen name it does not recognise rather than showing nothing', () => {
    expect(screenFor('?screen=ledger')).toBe('listing')
  })

  it('opens a named invoice, and says which one', () => {
    expect(screenFor('?screen=invoice&id=inv-9')).toBe('invoice')
    expect(invoiceIdFor('?screen=invoice&id=inv-9')).toBe('inv-9')
  })

  it('will not open an invoice screen with no invoice on it', () => {
    // A blank invoice screen with a spinner forever is worse than saying the link is broken.
    expect(invoiceIdFor('?screen=invoice')).toBeNull()
    expect(invoiceIdFor('?screen=invoice&id=')).toBeNull()
  })

  it('answers no invoice on every other screen, however the address got an id', () => {
    expect(invoiceIdFor('?id=inv-9')).toBeNull()
    expect(invoiceIdFor('?screen=listing&id=inv-9')).toBeNull()
  })
})

describe('the address navigating writes', () => {
  it('names the screen it went to', () => {
    expect(screenFor(addressFor('', 'create'))).toBe('create')
    expect(screenFor(addressFor('?screen=create', 'listing'))).toBe('listing')
  })

  it('keeps every other switch, which decide what the screen does', () => {
    const written = addressFor('?tax=inclusive&owner=1&rows=40', 'listing')
    const query = new URLSearchParams(written)
    expect(query.get('tax')).toBe('inclusive')
    expect(query.get('owner')).toBe('1')
    expect(query.get('rows')).toBe('40')
  })

  it('replaces the screen rather than adding a second one', () => {
    const written = addressFor('?screen=create', 'listing')
    expect(new URLSearchParams(written).getAll('screen')).toEqual(['listing'])
  })

  it('carries the invoice id when it is opening an invoice', () => {
    expect(invoiceIdFor(addressFor('', 'invoice', 'inv-9'))).toBe('inv-9')
  })

  it('takes the id off again when it leaves, rather than leaving it lying about', () => {
    // Left on, the next thing that looks for an id finds the one you already closed.
    const back = addressFor('?screen=invoice&id=inv-9', 'listing')
    expect(new URLSearchParams(back).has('id')).toBe(false)
  })
})
