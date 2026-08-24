// The settings drawer's answers, turned into what the invoice actually reads.
//
// TWO VOCABULARIES, ON PURPOSE. The drawer asks the question a shopkeeper would — "where is tax
// applied?" and "do prices include tax?" — as two separate switches, because that is how the
// answer is held in somebody's head. The invoice needs one word for the three arrangements it
// draws. This is the join, and it is a pure function so the mapping can be tested without a
// screen and cannot quietly differ between the two places that would otherwise do it.
//
// IT IS ALSO WHERE "THE SURFACE IS REAL AND THE EFFECT IS NOT" GETS FIXED. Everything mapped
// here changes the invoice the moment it is switched. Anything the invoice has no surface for
// yet is marked `parked` in the catalogue and says so in the drawer, rather than sitting there
// looking live — a switch that does nothing is worse than a switch that is not offered.

import type { InvoiceSettings } from '../data/schema/settings'
import type { RoundMethod } from './roundOff'

export type SettingValues = Record<string, string | boolean>

const ROUND_METHODS: Record<string, RoundMethod> = { up: 'up', down: 'down', nearest: 'nearest' }

export function invoiceSettingsFrom(values: SettingValues, companyStateCode: string): InvoiceSettings {
  // "On bill sundry" is one arrangement whatever prices do, because there is no per-line rate
  // to include tax in — the question does not arise, so the other switch is not consulted.
  const taxMode =
    values['taxMode'] === 'sundry' ? 'billWise' : values['pricesIncludeTax'] === true ? 'itemInclusive' : 'itemExclusive'

  const asked = String(values['roundOff'] ?? 'nearest')
  return {
    taxMode,
    roundOff: {
      stepPaise: 100,
      // `manual` and `ask` are answers the invoice cannot honour yet: one needs a figure to be
      // typed and the other needs a moment during save that is not built. They round to the
      // nearest rupee meanwhile, which is the closest true thing — and both are marked parked
      // in the catalogue so the drawer says so rather than implying otherwise.
      method: ROUND_METHODS[asked] ?? 'nearest',
      on: asked !== 'off',
    },
    columns: {
      discount: values['itemDiscount'] === true,
      alias: values['colAlias'] === true,
      hsn: values['colHsn'] === true,
      mrp: values['colMrp'] === true,
      freeQuantity: values['colFreeQty'] === true,
    },
    roundEachLine: values['roundEachLine'] === true,
    hsnWiseSummary: values['hsnWiseSummary'] === true,
    companyStateCode,
  }
}
