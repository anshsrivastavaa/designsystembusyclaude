import { describe, it, expect } from 'vitest'

import { contrastRatio } from './contrast'

describe('contrast ratio', () => {
  it('gives white against black as twenty-one to one', () => {
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5)
  })

  it('gives a colour against itself as one to one', () => {
    expect(contrastRatio('#0063d6', '#0063d6')).toBeCloseTo(1, 5)
  })

  it('does not care which colour is named first', () => {
    expect(contrastRatio('#666c76', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#666c76')!, 10)
  })

  it('reads the rgb form the browser hands back as well as hex', () => {
    expect(contrastRatio('rgb(255, 255, 255)', '#000000')).toBeCloseTo(21, 5)
  })

  it('measures muted ink on a hovered row above the four and a half floor', () => {
    expect(contrastRatio('#666c76', '#eef0f2')).toBeGreaterThanOrEqual(4.5)
  })

  it('returns nothing rather than a wrong number when a colour cannot be read', () => {
    expect(contrastRatio('not a colour', '#ffffff')).toBeNull()
  })
})
