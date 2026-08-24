import { describe, it, expect } from 'vitest'

import { formatBalancePaise, formatPaise, lineAmount, sumPaise, toPaise } from './money'

describe('money', () => {
  it('reads a typed rupee value as whole paise', () => {
    expect(toPaise('12.50')).toBe(1250)
    expect(toPaise(12.5)).toBe(1250)
  })

  it('rounds a third paise rather than carrying it', () => {
    expect(toPaise('0.005')).toBe(1)
    expect(toPaise('0.004')).toBe(0)
  })

  it('reads an empty or unreadable cell as nothing, never as NaN', () => {
    expect(toPaise('')).toBe(0)
    expect(toPaise('abc')).toBe(0)
  })

  it('refuses a number with rubbish after it, rather than reading the number and ignoring it', () => {
    expect(toPaise('12abc')).toBe(0)
  })

  it('groups a large amount the Indian way, in lakhs rather than thousands', () => {
    expect(formatPaise(123456789)).toBe('12,34,567.89')
    expect(formatPaise(100000)).toBe('1,000.00')
  })

  it('always prints two decimal places, so a column of amounts aligns', () => {
    expect(formatPaise(1250)).toBe('12.50')
    expect(formatPaise(1200)).toBe('12.00')
    expect(formatPaise(5)).toBe('0.05')
    expect(formatPaise(0)).toBe('0.00')
  })

  it('prints a genuine negative with a minus sign and never in colour', () => {
    expect(formatPaise(-1250)).toBe('-12.50')
  })

  it('multiplies quantity by price into whole paise', () => {
    expect(lineAmount(3, 1250)).toBe(3750)
    expect(lineAmount(2.5, 1000)).toBe(2500)
  })

  it('rounds a fractional quantity to whole paise rather than carrying a fraction', () => {
    expect(lineAmount(0.333, 100)).toBe(33)
  })

  it('reads an empty quantity as nothing', () => {
    expect(lineAmount(Number.NaN, 1250)).toBe(0)
  })

  it('adds two thousand lines without losing a paisa', () => {
    const lines = Array.from({ length: 2000 }, () => 1)
    expect(sumPaise(lines)).toBe(2000)
  })

  it('adds an empty invoice to nothing', () => {
    expect(sumPaise([])).toBe(0)
  })
})

describe('a party balance', () => {
  it('reads a receivable as Dr and a payable as Cr, carrying no sign of its own', () => {
    expect(formatBalancePaise(417900)).toBe('4,179.00 Dr')
    expect(formatBalancePaise(-417900)).toBe('4,179.00 Cr')
  })

  it('shows nothing owed as 0.00, so the column still aligns on the decimal point', () => {
    expect(formatBalancePaise(0)).toBe('0.00')
  })

  it('groups a large balance the Indian way like every other amount', () => {
    expect(formatBalancePaise(123456789)).toBe('12,34,567.89 Dr')
  })
})

describe('numbers the arithmetic cannot hold', () => {
  it('refuses Infinity rather than making every total Infinity', () => {
    // Number("Infinity") is Infinity, and `Number(typed) || 0` lets it straight through — one
    // keystroke and the grand total reads ∞.
    expect(toPaise('Infinity')).toBe(0)
    expect(toPaise('-Infinity')).toBe(0)
  })

  it('refuses a figure past the point where whole numbers stop being exact', () => {
    // Everything here is whole paise in a JavaScript number. Above 2^53 the integer promise is
    // simply false, and "1e30" is four keystrokes.
    expect(toPaise('1e30')).toBe(0)
    expect(toPaise(1e30)).toBe(0)
  })

  it('still takes any figure an invoice could really carry', () => {
    expect(toPaise('99999999.99')).toBe(9999999999)
    expect(toPaise('0.01')).toBe(1)
    expect(toPaise('-4')).toBe(-400)
  })
})

describe('a discount on the line', () => {
  // Typeable, shown in the Disc% column, and applied to nothing until 24-08.
  it('comes off the line amount', () => {
    expect(lineAmount(4, 10000, 5)).toBe(38000)
    expect(lineAmount(1, 11800, 100)).toBe(0)
  })

  it('no discount is the same answer as before it existed', () => {
    expect(lineAmount(3, 1250, 0)).toBe(3750)
    expect(lineAmount(3, 1250)).toBe(3750)
  })

  // Rounding the discount and subtracting it loses a paisa on about half of all lines, and
  // two thousand of those is twenty rupees the invoice cannot account for.
  it('is rounded once, at the end', () => {
    // 7 × 333 = 2331, less 7.5% is 2156.175 — one answer, rounded once.
    expect(lineAmount(7, 333, 7.5)).toBe(2156)
    // Rounding the discount first would give 2331 - 175 = 2156 here too, so a case where the
    // two disagree: 3 × 505 = 1515, less 3.5% is 1461.975 → 1462. Discount-first rounds 53.025
    // to 53 and gives 1462 as well; 9 × 777 = 6993, less 12.5% is 6118.875 → 6119, where
    // discount-first rounds 874.125 to 874 and gives 6119. The disagreement is at the half:
    // 1 × 1000 less 0.05% is 999.5 → 1000, where discount-first rounds 0.5 to 1 and gives 999.
    expect(lineAmount(1, 1000, 0.05)).toBe(1000)
  })

  it('rubbish in a discount box leaves the amount alone rather than emptying the line', () => {
    expect(lineAmount(4, 10000, Number.NaN)).toBe(40000)
  })
})
