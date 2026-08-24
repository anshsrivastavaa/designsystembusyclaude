import { expect, test } from '@playwright/test'

// WHAT SOMEBODY WHO ASKED FOR LESS MOVEMENT ACTUALLY GETS.
//
// The reduced-motion block in packages/tokens/motion.css forced every animation to 1ms and left
// the iteration count alone. Tailwind's `animate-pulse` is a 2s INFINITE loop, and it was on the
// sparkle in MagicButton — so the person who set the operating system preference got that icon
// flickering at the refresh rate. Measured before the fix:
//
//   {"name":"pulse","duration":"0.001s","iterations":"infinite"}
//
// A 1ms animation that repeats for ever is not "no animation". It is a strobe, and a strobe is
// the exact thing WCAG 2.3.3 exists to prevent — so the block read as complete while making the
// problem worse for the people it was written for.
//
// THIS TEST MEASURES THE RENDERING, NOT THE STYLESHEET. It asks the browser what the element is
// doing, under a real emulated preference, in a production build. A grep for
// `animation-iteration-count` in the CSS would have passed the day the line was added and said
// nothing about whether it reached the sparkle.
//
// AND IT MEASURES THE INSTRUMENT FIRST. Written with `test.use({ reducedMotion: 'reduce' })`,
// which is the documented way, the browser reported
// `matchMedia('(prefers-reduced-motion: reduce)').matches === false` — the preference never
// reached the page, so every assertion under it was about the ordinary screen wearing the name
// of the reduced one. `page.emulateMedia` applies, and the first expectation in each test is
// that it applied. A probe that cannot see the thing answers the same whatever the code does.

async function askingForLessMotion(page: import('@playwright/test').Page) {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.locator('svg.motion-pulse').first()).toBeAttached()
  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
}

test.describe('with the operating system asking for less motion', () => {
  test('nothing on the screen repeats for ever', async ({ page }) => {
    await askingForLessMotion(page)

    const looping = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>('*')]
        .map((element) => ({
          name: getComputedStyle(element).animationName,
          iterations: getComputedStyle(element).animationIterationCount,
        }))
        .filter((seen) => seen.name !== 'none' && seen.iterations !== '1'),
    )

    expect(looping).toEqual([])
  })

  test('the sparkle animates once and stops', async ({ page }) => {
    await askingForLessMotion(page)

    const seen = await page.locator('svg.motion-pulse').first().evaluate((element) => {
      const style = getComputedStyle(element)
      return { name: style.animationName, iterations: style.animationIterationCount }
    })

    expect(seen.name).toBe('motion-pulse')
    expect(seen.iterations).toBe('1')
  })
})

test('without that preference the sparkle does pulse, so the test above is measuring something', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  await expect(page.locator('svg.motion-pulse').first()).toBeAttached()

  const seen = await page.locator('svg.motion-pulse').first().evaluate((element) => {
    const style = getComputedStyle(element)
    return { name: style.animationName, iterations: style.animationIterationCount }
  })

  // The other half of the claim. Without this, a screen with no animation at all would pass
  // every assertion above and prove nothing about the reduced-motion block. How LONG it takes
  // is not asserted — the token layer owns that, and a duration written here would be a second
  // copy of a number, which is what the raw-duration gate exists to stop.
  expect(seen.name).toBe('motion-pulse')
  expect(seen.iterations).toBe('infinite')
})
