import { describe, expect, it } from 'vitest'

import { ROUND_OFF_DEFAULT, roundOffPaise, roundedTotal, type RoundOff } from './roundOff'

const to = (stepPaise: number, method: RoundOff['method']): RoundOff => ({ stepPaise, method })

describe('round off', () => {
  it('leaves a total that is already on the step exactly alone', () => {
    expect(roundedTotal(125000, ROUND_OFF_DEFAULT)).toBe(125000)
    expect(roundOffPaise(125000, ROUND_OFF_DEFAULT)).toBe(0)
  })

  it('sends the nearest rupee the way the paise point', () => {
    expect(roundedTotal(125049, to(100, 'nearest'))).toBe(125000)
    expect(roundedTotal(125051, to(100, 'nearest'))).toBe(125100)
  })

  it('settles an exact half upward, the way a printed invoice always has', () => {
    expect(roundedTotal(125050, to(100, 'nearest'))).toBe(125100)
  })

  it('rounds up and down the number line, not away from and towards zero', () => {
    expect(roundedTotal(125001, to(100, 'up'))).toBe(125100)
    expect(roundedTotal(125099, to(100, 'down'))).toBe(125000)
    // A credit note. "Up" makes the figure larger, which here means smaller in magnitude.
    expect(roundedTotal(-125001, to(100, 'up'))).toBe(-125000)
    expect(roundedTotal(-125001, to(100, 'down'))).toBe(-125100)
  })

  it('rounds to a step that is not the rupee, because the setting allows one', () => {
    expect(roundedTotal(125240, to(1000, 'nearest'))).toBe(125000)
    expect(roundedTotal(125600, to(1000, 'nearest'))).toBe(126000)
  })

  it('is off at a step of zero, and off means the total is untouched rather than an error', () => {
    expect(roundedTotal(125049, to(0, 'nearest'))).toBe(125049)
    expect(roundOffPaise(125049, to(0, 'nearest'))).toBe(0)
    expect(roundedTotal(125049, to(-100, 'nearest'))).toBe(125049)
  })

  it('reports the difference and not the result, because that is what the line shows', () => {
    expect(roundOffPaise(125049, to(100, 'nearest'))).toBe(-49)
    expect(roundOffPaise(125051, to(100, 'nearest'))).toBe(49)
    expect(roundOffPaise(125001, to(100, 'up'))).toBe(99)
  })

  it('defaults to the whole rupee, nearest', () => {
    expect(ROUND_OFF_DEFAULT).toEqual({ stepPaise: 100, method: 'nearest' })
  })
})
