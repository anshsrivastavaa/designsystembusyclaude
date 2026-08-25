import { expect, test } from '@playwright/test'

// THE PARTY LIST CAME OFF ITS FIELD ON THE DEPLOYED BUILD, and this is the case that catches it.
//
// WHAT HAPPENED. `Popover` took the anchor's width as a minimum, and that minimum was React
// state set inside the effect that measures the panel — so the panel's size depended on the
// effect measuring the panel, one render behind. Measured on the running build: open the party
// list at 1440 wide, shrink the window to 560, and the clamp ran with the panel's STALE 490px
// width against the new 560px window. `furthest` came out 62, the panel was pinned at 62 while
// its field was at 109, and it stayed there — 47 pixels off its field, sitting over the rail.
// A wider field, or a browser zoomed in, makes `furthest` negative and it lands hard against the
// window's edge.
//
// WHY THE WINDOW IS RESIZED RATHER THAN JUST OPENED. A panel that has never been measured at a
// different size cannot show this at all: the first placement is always self-consistent. The two
// answers only compete once the window has changed under a panel that is already open — which is
// the ordinary case of somebody dragging a window or pressing Ctrl+plus, and is exactly where the
// popover edge test was caught once before sampling a place the panel never wanted to overflow.

const EDGE = 8

// IT FINDS THE FIELD BY ASKING WHICH ELEMENT DRAWS THE BORDER, and never by reading the anchor
// that was passed in. That distinction is the whole reason this bug survived three rounds: the
// panel matched its anchor perfectly every time it was measured, and the anchor was the INPUT —
// a box 46 pixels narrower than the frame a person points at. An anchor always agrees with
// itself, so a test that measures it can only ever confirm the mistake.
async function drift(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const input = document.querySelector('input[role="combobox"]')
    const panel = document.querySelector('[data-slot="popover"]')
    if (!input || !panel) return null

    let field: HTMLElement | null = input.parentElement
    while (field !== null && Number.parseFloat(getComputedStyle(field).borderTopWidth) === 0) {
      field = field.parentElement
    }
    if (field === null) return null
    const anchor = field.getBoundingClientRect()
    const surface = panel.getBoundingClientRect()
    return {
      apart: Math.round(surface.left - anchor.left),
      narrower: Math.round(anchor.width - surface.width),
      left: Math.round(surface.left),
      right: Math.round(surface.right),
      window: window.innerWidth,
    }
  })
}

test('the list keeps its field however the window moves under it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/?screen=create')

  // The party list opens by itself on this field, which is why it is the one that was seen.
  await expect(page.locator('[data-slot="popover"]')).toBeVisible()
  const first = await drift(page)
  expect(first?.apart, 'the list is off its field before anything moves').toBe(0)
  expect(first?.narrower, 'the list is narrower than the field it hangs off').toBe(0)

  // ONE LARGE JUMP, NOT A WALK DOWN. The first version of this stepped 1440 → 900 → 700 → 560
  // and passed against the fault, because each small step let the stale width catch up before the
  // next one — the panel was never much wider than the window it was being clamped into. The
  // failure needs the panel's old width to EXCEED the new window, which only a big jump gives.
  // A test that walks gently past the place two answers disagree is a test that cannot fail.
  for (const width of [560, 1440, 420]) {
    await page.setViewportSize({ width, height: 700 })
    await page.waitForTimeout(150)

    const seen = await drift(page)
    expect(seen, 'the list vanished when the window changed').not.toBeNull()
    expect(seen!.apart, `the list is ${seen!.apart}px from its field at ${width} wide`).toBe(0)
    expect(seen!.narrower, `the list is ${seen!.narrower}px narrower than its field at ${width}`).toBeLessThanOrEqual(0)

    // And it is still on the screen — a panel clamped to nothing is the other way to fail this.
    expect(seen!.left).toBeGreaterThanOrEqual(EDGE - 1)
    expect(seen!.right).toBeLessThanOrEqual(seen!.window)
  }
})
