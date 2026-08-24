import { expect, test } from '@playwright/test'

// A CONTROL THAT GIVES WAY UNDER THE FINGER. The smallest confirmation an interface can make
// that it heard a press, and the first thing Emil Kowalski's rules ask of anything pressable.
//
// IT IS HERE BECAUSE A CLASS THAT NEVER REACHES THE SCREEN LOOKS EXACTLY LIKE ONE THAT DOES.
// `shape` was declared on Button, typed, and passed at every call site last week, and never
// destructured — types green, callers correct, nothing drawn. This asks the running page.
//
// `transform`, NOT THE `scale` PROPERTY, AND THE READING MOVED WITH THE CODE. Tailwind's
// `scale-97` writes CSS `scale`, which `transition-property: transform` does not cover — so the
// hand-written version this replaced was easing nothing the transition knew about, and a check
// reading `transform` would have read an empty string for ever and passed whatever the element
// did. `pressable` sets `transform`, so that is what this asks.
test('a header control gives way under the press, and springs back on release', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.keyboard.press('Escape')

  // THE VOUCHER TITLE RATHER THAN BACK, and that is not arbitrary. Chrome keeps `:active` on
  // the element that took the press until the button is released, so dragging off does not end
  // it — the press has to be released over the control. Released over Back, the press navigates
  // away from the invoice and there is nothing left to measure. The title opens a popover and
  // stays exactly where it is.
  const title = page.getByRole('button', { name: /switch voucher type/i })
  const pressed = () => title.evaluate((node) => getComputedStyle(node).transform)
  const motion = await title.evaluate((node) => {
    const seen = getComputedStyle(node)
    return { property: seen.getPropertyValue('transition-property'), speed: seen.getPropertyValue('transition-duration') }
  })
  // THE TOKEN'S VALUE, READ OFF THE PAGE, RATHER THAN A NUMBER TYPED HERE. A number typed here
  // is the raw value the token layer exists to stop, and it would go stale the first time the
  // speed moved — silently, since it would still be a number and still be green.
  const swift = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--motion-swift').trim(),
  )

  expect(await pressed()).toBe('none')

  const box = await title.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await page.mouse.down()
  // Polled rather than waited on, so this measures where the scale SETTLED rather than a frame
  // somewhere along the way to it.
  await expect.poll(pressed).toBe('matrix(0.97, 0, 0, 0.97, 0, 0)')
  await page.mouse.up()
  await expect.poll(pressed).toBe('none')
  await page.keyboard.press('Escape')

  // NAMED PROPERTIES, NEVER `all`, and inside the 100-160ms a press wants. `all` transitions
  // whatever else happens to change with it, which is how a colour ends up easing on a curve
  // authored for movement.
  expect(motion.property).not.toContain('all')
  expect(motion.property).toContain('transform')
  // AS SECONDS, NOT AS STRINGS. The custom property comes back as ".12s" and the computed
  // transition as "0.12s" — the same length of time written two ways, and a string comparison
  // calls that a difference.
  expect(Number.parseFloat(motion.speed)).toBeCloseTo(Number.parseFloat(swift))
})

