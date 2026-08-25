// The shorthand, and the fault it was written for.
//
// `5k` reached `toPaise`, where `Number('5k')` is NaN, and the guard there turned NaN into zero.
// The first test below is that fault, written as the thing that must never be true again: a cell
// that takes the shorthand the product advertises and stores nothing.

import { describe, expect, it } from 'vitest'

import { toPaise } from '../../lib/money'
import { acceptsTyped, expandShorthand } from './moneyShorthand'

describe('money shorthand', () => {
  it('is worth something — the whole reason this exists', () => {
    // The end of the chain, not the middle of it. Asserting `expandShorthand('5k') === '5000'`
    // would have passed on the day the bug shipped, because the expansion was never the broken
    // part — nothing was calling it. What matters is the paise the store ends up holding.
    expect(toPaise(expandShorthand('5k'))).toBe(5_000_00)
    expect(toPaise(expandShorthand('5l'))).toBe(5_00_000_00)
    expect(toPaise(expandShorthand('5cr'))).toBe(5_00_00_000_00)
  })

  it('takes them in either case, because nobody is holding shift for this', () => {
    expect(expandShorthand('5K')).toBe('5000')
    expect(expandShorthand('5L')).toBe('500000')
    expect(expandShorthand('5CR')).toBe('50000000')
    expect(expandShorthand('5Cr')).toBe('50000000')
  })

  it('multiplies a decimal, so 1.5k is fifteen hundred rather than a refusal', () => {
    expect(toPaise(expandShorthand('1.5k'))).toBe(1_500_00)
    expect(toPaise(expandShorthand('2.25l'))).toBe(2_25_000_00)
  })

  it('leaves a half-typed crore standing at its own number', () => {
    // Two keystrokes into "5cr" the person has not said crore yet. Reading `5c` as crore makes
    // the cell worth five crore while they reach for the r — and worth five crore for good if
    // they stop there. So the number stands alone until the suffix is finished.
    expect(expandShorthand('5c')).toBe('5')
    expect(expandShorthand('5cr')).toBe('50000000')
  })

  it('hands back anything with no suffix exactly as it arrived', () => {
    // "12." and a bare "-" are what half-typed numbers look like. Parsing and re-printing them
    // would destroy both, which is the fault EditableCell's draft exists to avoid.
    expect(expandShorthand('12.')).toBe('12.')
    expect(expandShorthand('-')).toBe('-')
    expect(expandShorthand('')).toBe('')
    expect(expandShorthand('12.50')).toBe('12.50')
  })

  it('does not invent a number out of a suffix with nothing in front of it', () => {
    expect(toPaise(expandShorthand('k'))).toBe(0)
    expect(toPaise(expandShorthand('cr'))).toBe(0)
  })

  it('refuses a letter anywhere but the tail, so 5k5 is not five thousand and five', () => {
    expect(acceptsTyped('price', '5k5')).toBe(false)
    expect(acceptsTyped('price', 'k5')).toBe(false)
    expect(expandShorthand('5k5')).toBe('5k5')
  })
})

describe('what a cell will let you type', () => {
  it('lets a money cell through the whole of 5cr, one keystroke at a time', () => {
    // The half-typed states matter as much as the finished one: a cell that refuses "5c" is a
    // cell where "5cr" cannot be typed at all.
    for (const step of ['', '5', '5c', '5cr']) expect(acceptsTyped('price', step)).toBe(true)
  })

  it('refuses every other letter in a money cell', () => {
    for (const letter of ['5x', '5m', '5b', '5t', '5e', '5d']) {
      expect(acceptsTyped('price', letter)).toBe(false)
    }
  })

  it('refuses the letters that used to slip past as a number', () => {
    // These are the ones that are dangerous rather than merely wrong: JavaScript reads all three
    // as numbers, so each would have reached the store as a real figure nobody typed.
    expect(acceptsTyped('price', '1e30')).toBe(false)
    expect(acceptsTyped('price', 'Infinity')).toBe(false)
    expect(acceptsTyped('price', '0x10')).toBe(false)
  })

  it('takes no letters at all in a count, and still takes a decimal and a minus', () => {
    expect(acceptsTyped('quantity', '5k')).toBe(false)
    expect(acceptsTyped('quantity', '12.5')).toBe(true)
    expect(acceptsTyped('quantity', '-')).toBe(true)
    expect(acceptsTyped('freeQuantity', '5cr')).toBe(false)
  })

  it('leaves the word columns alone, because an item name may contain any of these letters', () => {
    expect(acceptsTyped('item', 'Krishna Cranks Ltd')).toBe(true)
    expect(acceptsTyped('unit', 'kg')).toBe(true)
  })
})
