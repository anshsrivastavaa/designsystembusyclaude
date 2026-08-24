import { describe, expect, it } from 'vitest'

import { nextStop, NOTHING, stopsOf } from './comboBoxStops'

const plain = { hasLead: false, hasSticky: false }

describe('where the arrows stop', () => {
  it('counts the options when nothing is pinned', () => {
    expect(stopsOf(3, 0, plain)).toEqual({ count: 3, onLeadRow: false, onStickyRow: false, optionIndex: 0 })
  })

  it('makes the leading pinned row the first stop and shifts the options along', () => {
    expect(stopsOf(3, 0, { hasLead: true }).onLeadRow).toBe(true)
    expect(stopsOf(3, 0, { hasLead: true }).optionIndex).toBe(-1)
    // Stop 1 is the FIRST option, not the second.
    expect(stopsOf(3, 1, { hasLead: true }).optionIndex).toBe(0)
    expect(stopsOf(3, 3, { hasLead: true }).optionIndex).toBe(2)
  })

  it('makes the trailing pinned row the last stop, after any leading one', () => {
    expect(stopsOf(3, 4, { hasLead: true, hasSticky: true })).toMatchObject({ count: 5, onStickyRow: true, optionIndex: -1 })
    expect(stopsOf(3, 3, { hasSticky: true })).toMatchObject({ count: 4, onStickyRow: true })
  })

  it('still has both pinned rows to stop on when nothing matched at all', () => {
    const stops = stopsOf(0, 0, { hasLead: true, hasSticky: true })
    expect(stops.count).toBe(2)
    expect(stops.onLeadRow).toBe(true)
    expect(stopsOf(0, 1, { hasLead: true, hasSticky: true }).onStickyRow).toBe(true)
  })

  it('has no stops at all on an empty list with nothing pinned to it', () => {
    expect(stopsOf(0, 0, plain)).toEqual({ count: 0, onLeadRow: false, onStickyRow: false, optionIndex: -1 })
  })

  it('clamps a highlight the list has shrunk out from under', () => {
    expect(stopsOf(2, 9, plain).optionIndex).toBe(1)
  })
})

describe('nothing highlighted', () => {
  it('is a real state, and it picks nothing', () => {
    // The party field could not be left without choosing somebody: the list opened on focus,
    // the first row was highlighted, and Tab picked the highlighted row. Nothing highlighted
    // is what unpicks that knot, and it is visible rather than hidden state.
    const stops = stopsOf(4, NOTHING, { hasLead: true, hasSticky: true })
    expect(stops.optionIndex).toBe(NOTHING)
    expect(stops.onLeadRow).toBe(false)
    expect(stops.onStickyRow).toBe(false)
    // The stops are all still there — nothing is highlighted, not nothing exists.
    expect(stops.count).toBe(6)
  })
})

describe('the next stop', () => {
  it('wraps off the end and off the beginning', () => {
    expect(nextStop(2, 1, 3)).toBe(0)
    expect(nextStop(0, -1, 3)).toBe(2)
  })

  it('highlights nothing when there is nowhere to go', () => {
    expect(nextStop(0, 1, 0)).toBe(NOTHING)
    expect(nextStop(0, -1, 0)).toBe(NOTHING)
  })

  it('enters the list from NOTHING — down at the top, up at the bottom', () => {
    expect(nextStop(NOTHING, 1, 4)).toBe(0)
    expect(nextStop(NOTHING, -1, 4)).toBe(3)
  })
})
