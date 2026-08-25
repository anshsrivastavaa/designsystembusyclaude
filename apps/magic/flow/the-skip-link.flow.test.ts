import { expect, test } from '@playwright/test'

// ELEVEN CONTROLS OF CHROME BEFORE THE SCREEN, AND ALL ELEVEN STAY.
//
// The complaint was real — tabbing into the invoice cost ten stops first — and the obvious fix
// was to take controls out of the tab order. That is not a fix, it is taking eleven working
// controls away from the people who navigate by keyboard, which is the only group it was meant
// to help. A skip link gives the walk back and costs nobody anything.
//
// IT IS MEASURED BY TABBING, NOT BY LOOKING FOR AN ELEMENT. A skip link that exists in the
// markup and is not the first thing Tab reaches is a skip link nobody can use.

test('one Tab reaches the skip link, and it lands on the screen', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()

  await page.keyboard.press('Tab')

  const link = page.getByRole('link', { name: /Skip to the screen/ })
  await expect(link).toBeFocused()

  // Seen only while it holds the keyboard. Off-screen positioning is not enough on its own —
  // this asks the browser where it actually is.
  const box = await link.boundingBox()
  expect(box, 'the skip link has no box while focused, so nobody can read it').not.toBeNull()
  expect(box!.width).toBeGreaterThan(0)
  expect(box!.height).toBeGreaterThan(0)

  await page.keyboard.press('Enter')
  await expect(page.locator('main')).toBeFocused()
})

test('it is out of the way again once the keyboard moves on', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()

  const link = page.getByRole('link', { name: /Skip to the screen/ })
  // IT IS CLIPPED, NOT SHRUNK, and the difference matters to the test rather than to the user.
  // `getBoundingClientRect` reports the box a clipped element WOULD have had — 24 by 16 here —
  // so a size assertion passes on a link that is plainly visible. What makes it unseen is the
  // clip, so that is what is measured.
  const hidden = await link.evaluate((element) => {
    const style = getComputedStyle(element)
    return { clip: style.clipPath, overflow: style.overflow }
  })

  expect(hidden.clip).toBe('inset(50%)')
  expect(hidden.overflow).toBe('hidden')
})

test('every one of the chrome controls is still reachable', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('main')).toBeVisible()

  const reached: string[] = []
  for (let press = 0; press < 14; press += 1) {
    await page.keyboard.press('Tab')
    const name = await page.evaluate(() => {
      const at = document.activeElement
      if (!(at instanceof HTMLElement)) return ''
      return at.getAttribute('aria-label') ?? at.textContent?.trim().slice(0, 24) ?? ''
    })
    if (name !== '') reached.push(name)
  }

  // The point of the block: the walk is still there for anybody who wants it.
  for (const control of ['User', 'Favourites', 'Housekeeping', 'Help']) {
    expect(reached.join(' | '), `${control} is no longer reachable by Tab`).toContain(control)
  }
})
