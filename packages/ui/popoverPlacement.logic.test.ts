import { describe, expect, it } from 'vitest'

import { placeAt, roomFor, type Box } from './popoverPlacement'

/** The clearance the module keeps from the window's edge. Written here rather than imported so
 *  the test states the number it is claiming rather than agreeing with whatever the module says —
 *  a constant compared against itself proves nothing. */
const EDGE = 8

// THE ARITHMETIC, ASKED DIRECTLY. Every fault this placement has had was one of four numbers, and
// each was found on a running build by measuring — which is slow, and needs a build, and only
// happens after somebody notices. These cases are the same questions asked in milliseconds.

const box = (left: number, top: number, width: number, height: number): Box => ({
  left, top, width, height, right: left + width, bottom: top + height,
})

const WINDOW = { width: 1440, height: 900 }

describe('where a panel goes', () => {
  it('sits under its anchor when there is room, because that is where the eye already is', () => {
    const at = placeAt(box(100, 200, 300, 32), { width: 300, height: 200 }, WINDOW, 'start')
    expect(at.left).toBe(100)
    expect(at.top).toBe(236)
  })

  it('flips above only when it will not fit below AND there is more room above', () => {
    // 700px down a 900px window: 192 below, 692 above.
    const flipped = placeAt(box(100, 700, 300, 32), { width: 300, height: 400 }, WINDOW, 'start')
    expect(flipped.top).toBe(700 - 400 - 4)

    // The same panel higher up fits below and must stay there.
    const stayed = placeAt(box(100, 100, 300, 32), { width: 300, height: 400 }, WINDOW, 'start')
    expect(stayed.top).toBe(136)
  })

  it('lines its right edge up with the anchor when asked', () => {
    const at = placeAt(box(1000, 100, 200, 32), { width: 120, height: 100 }, WINDOW, 'end')
    expect(at.left).toBe(1200 - 120)
  })

  it('never leaves the window, on either axis', () => {
    const wide = placeAt(box(1380, 100, 40, 32), { width: 300, height: 100 }, WINDOW, 'start')
    expect(wide.left).toBe(WINDOW.width - 300 - EDGE)

    const tall = placeAt(box(100, 100, 300, 32), { width: 300, height: 2000 }, WINDOW, 'start')
    expect(tall.top).toBe(EDGE)
  })

  it('a panel wider than the window lands at the edge rather than off it', () => {
    // This is the shape that put the party list over the left rail: a minimum width taken from a
    // near-full-width field, in a window that had since become smaller. The clamp must collapse to
    // the edge and not to a negative number.
    const at = placeAt(box(109, 110, 490, 32), { width: 1600, height: 300 }, { width: 560, height: 700 }, 'start')
    expect(at.left).toBe(EDGE)
    expect(at.left).toBeGreaterThanOrEqual(0)
  })
})

describe('how tall a panel may be', () => {
  it('takes its own ceiling on a roomy window', () => {
    expect(roomFor('default', WINDOW)).toBe(384)
    expect(roomFor('tall', WINDOW)).toBe(480)
  })

  it('gives way to the window when the window is shorter, so nothing is ever cut off-screen', () => {
    expect(roomFor('tall', { width: 1440, height: 400 })).toBe(400 - EDGE * 2)
  })

  it('gives the settlement panel about a hundred more than a list gets', () => {
    expect(roomFor('tall', WINDOW) - roomFor('default', WINDOW)).toBe(96)
  })
})
