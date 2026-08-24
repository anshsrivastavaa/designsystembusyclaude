// Round off. A toggle beside the grand total, never a bill sundry row — it is not a charge
// anybody makes, it is the last two digits being tidied away, and putting it in the charge
// list would let it be taxed.
//
// It applies to the FINAL payable and nothing above it. The tax figures higher up the
// breakdown are what get filed, so rounding may not touch them.

import type { Paise } from './money'

/** Up and down mean up and down the number line, not away from and towards zero. On a credit
 * note, where the total is negative, "round up" still means the figure gets larger. */
export type RoundMethod = 'up' | 'down' | 'nearest'

export type RoundOff = {
  /** The step, in paise. 100 is the whole rupee everybody actually uses. Zero is off. */
  stepPaise: Paise
  method: RoundMethod
}

/** What a fresh invoice starts with, until settings say otherwise: to the rupee, nearest. */
export const ROUND_OFF_DEFAULT: RoundOff = { stepPaise: 100, method: 'nearest' }

/** The payable after rounding. A step of zero or less is off, and off returns the total
 * untouched rather than throwing — a setting nobody has filled in is not an error. */
export function roundedTotal(totalPaise: Paise, setting: RoundOff): Paise {
  if (setting.stepPaise <= 0) return totalPaise
  const steps = totalPaise / setting.stepPaise
  if (setting.method === 'up') return Math.ceil(steps) * setting.stepPaise
  if (setting.method === 'down') return Math.floor(steps) * setting.stepPaise
  // Ties go up, the way a printed invoice has always settled them.
  return Math.floor(steps + 0.5) * setting.stepPaise
}

/** The round off LINE — what the breakdown shows, which is the difference and not the result.
 * It is signed, and it is the one figure in the column that is routinely negative. */
export function roundOffPaise(totalPaise: Paise, setting: RoundOff): Paise {
  return roundedTotal(totalPaise, setting) - totalPaise
}
