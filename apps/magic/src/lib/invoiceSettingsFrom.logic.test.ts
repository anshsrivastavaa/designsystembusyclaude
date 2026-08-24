import { describe, expect, it } from 'vitest'

import { invoiceSettingsFrom } from './invoiceSettingsFrom'

const from = (values: Record<string, string | boolean>) => invoiceSettingsFrom(values, '23')

describe('turning the drawer’s answers into what the invoice reads', () => {
  it('reads two switches as one arrangement', () => {
    expect(from({ taxMode: 'item', pricesIncludeTax: false }).taxMode).toBe('itemExclusive')
    expect(from({ taxMode: 'item', pricesIncludeTax: true }).taxMode).toBe('itemInclusive')
  })

  it('ignores whether prices include tax when tax is on the bill', () => {
    // There is no per-line rate for a price to include, so the question does not arise.
    expect(from({ taxMode: 'sundry', pricesIncludeTax: true }).taxMode).toBe('billWise')
    expect(from({ taxMode: 'sundry', pricesIncludeTax: false }).taxMode).toBe('billWise')
  })

  it('turns round off off, rather than rounding to nothing', () => {
    expect(from({ roundOff: 'off' }).roundOff.on).toBe(false)
    expect(from({ roundOff: 'nearest' }).roundOff).toMatchObject({ on: true, method: 'nearest' })
    expect(from({ roundOff: 'up' }).roundOff).toMatchObject({ on: true, method: 'up' })
  })

  it('falls back to the nearest rupee for the two answers the invoice cannot honour yet', () => {
    for (const asked of ['manual', 'ask']) {
      expect(from({ roundOff: asked }).roundOff).toMatchObject({ on: true, method: 'nearest' })
    }
  })

  it('answers with something usable when nothing has been chosen at all', () => {
    expect(from({})).toMatchObject({ taxMode: 'itemExclusive', roundEachLine: false })
    expect(from({}).roundOff.on).toBe(true)
  })
})
