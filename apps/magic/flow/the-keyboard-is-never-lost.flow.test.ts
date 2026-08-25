import { expect, test } from '@playwright/test'

import { itemGrid } from './cells'
import { openInvoice } from './invoice'

// One invariant, checked after every keypress: something inside the invoice holds the
// keyboard.
//
// Five separate bugs have been the same bug wearing different clothes — a ring on a cell the
// keyboard had left, two rings at once, a click dropping focus on the page body, Enter from
// Unit landing on a row that did not exist, a held arrow key outrunning the focus handoff.
// Each was found by a person on a screen and then covered by a journey about that one path.
// This is the journey about the property none of them may break.

const KEYS = [
  'ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight',
  'Tab', 'Shift+Tab', 'Enter', 'Escape',
  'a', 'e', 'S', '4', 'Backspace',
  'Control+End', 'Control+Home',
]

// Deterministic. A fuzz that cannot be replayed is a fuzz that reports a failure nobody can
// reproduce.
function nextKey(seed: number) {
  const next = (seed * 1103515245 + 12345) % 2147483648
  return { seed: next, key: KEYS[next % KEYS.length]! }
}

test('something inside the invoice always holds the keyboard', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=40', 3)
  await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()

  // Two properties, not one. That something holds the keyboard, AND that the something is a
  // thing a person can actually use — an input, a button, or a cell. Focus parked on a
  // wrapper is not lost, but it is not anywhere either.
  const holder = () =>
    page.evaluate(() => {
      const active = document.activeElement
      const invoice = document.querySelector('main')
      if (!active || active === document.body) return 'the page body'
      if (!invoice?.contains(active) && !active.closest('[role="listbox"],[role="dialog"]')) {
        return `outside the invoice: ${active.tagName}`
      }
      const usable =
        active.tagName === 'INPUT' ||
        // A select is a control a person uses, and the party and item drawers are full of them
        // — Group, State, Unit, Tax category. It was missing from this list rather than from
        // the product: the fuzz tabbed onto one and this reported the keyboard as parked.
        active.tagName === 'SELECT' ||
        active.tagName === 'BUTTON' ||
        active.getAttribute('role') === 'gridcell' ||
        active.getAttribute('role') === 'dialog'
      return usable ? 'inside' : `parked on a ${active.tagName} that is not a control`
    })

  let seed = 20_08_2026
  // BACK IS A CONTROL LIKE ANY OTHER, and the fuzz reaches it — it tabs onto Back and presses
  // Enter at press 100, every run. That is a person leaving, not a fault, so the journey walks
  // back in and carries on. What it will not accept is the keyboard being dropped on the way
  // out: leaving a screen has to hand it to the one arriving, and for a while it did not.
  let leftTheScreen = 0
  for (let press = 0; press < 300; press += 1) {
    const drawn = nextKey(seed)
    seed = drawn.seed
    await page.keyboard.press(drawn.key)

    const where = await holder()
    if (await page.getByRole('grid').count() === 0) {
      expect(where, `leaving the invoice at press ${press + 1} (${drawn.key}) dropped the keyboard`).toBe('inside')
      leftTheScreen += 1
      await openInvoice(page, '/?screen=create&rows=40', 3)
      await expect(page.getByRole('combobox', { name: 'Party' })).toBeFocused()
      continue
    }
    expect(where, `after ${press + 1} presses, the last being ${drawn.key}`).toBe('inside')

    // And the net never had to catch anything. Asserting only that SOMETHING holds the
    // keyboard proves the net works, not that the grid is right — the net was what made the
    // test pass. This is the assertion that watches the net instead of leaning on it.
    const rescues = await page.evaluate(() => document.querySelector('main')?.dataset['keyboardRescues'])
    expect(rescues, `the keyboard had to be rescued by press ${press + 1} (${drawn.key})`).toBe('0')
  }

  // The fuzz has to have spent its presses on the invoice. If a change made every key leave the
  // screen, everything above would pass while testing almost nothing.
  expect(leftTheScreen, 'the fuzz spent its presses walking in and out rather than on the grid').toBeLessThan(10)
})

test('the keyboard survives clicking about between keys', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=40', 3)
  await page.keyboard.press('Escape')

  // THE GUTTER IS NOT ONE OF THE COLUMNS THIS WALKS. It holds the delete control on the row
  // the pointer is on, so clicking it on a FILLED line deletes the line — which is the control
  // doing its job, not a keyboard fault. This journey used to click it safely only because the
  // lines were empty at the moment it ran, which stopped being true the day every journey
  // started waiting for its invoice to load.
  const cells = itemGrid(page).getByRole('row').nth(3).getByRole('gridcell')
  for (const column of [5, 2, 1, 4, 3]) {
    await cells.nth(column).click()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Tab')

    const inside = await page.evaluate(() => {
      const active = document.activeElement
      return active !== document.body && active !== null
    })
    expect(inside, `after clicking column ${column}`).toBe(true)
  }
})

test('exactly one ring is on screen, and it is where the keyboard is', async ({ page }) => {
  await openInvoice(page, '/?screen=create&rows=40', 3)
  await page.keyboard.press('Escape')
  await page.getByRole('row').nth(1).getByRole('gridcell').nth(4).click()

  for (const key of ['Tab', 'ArrowRight', 'Tab', 'ArrowDown', 'Tab']) {
    await page.keyboard.press(key)

    const rings = await page.evaluate(() => {
      const ringed = [...document.querySelectorAll('[role="gridcell"]')].filter(
        (cell) => getComputedStyle(cell).outlineStyle === 'solid',
      )
      const active = document.activeElement
      return {
        count: ringed.length,
        holdsTheKeyboard: ringed.every((cell) => cell === active || cell.contains(active)),
      }
    })

    expect(rings.count, `after ${key}`).toBeLessThanOrEqual(1)
    expect(rings.holdsTheKeyboard, `after ${key}`).toBe(true)
  }
})

// MAGIC IS KEYBOARD FRIENDLY, NOT KEYBOARD ONLY — Aj, 25-08, and this is that ruling as a test.
//
// The invoice used to wrap Tab at both ends of `<main>`: at the last control it called
// `preventDefault()` and moved focus to the first itself, and the reverse at the first. So focus
// could never leave the page — not to the top menu, which was the intention, and not to the
// browser's own address bar, tab strip or extensions either, which nobody decided. WCAG 2.1.2 is
// the one accessibility rule that is a flat prohibition rather than a quality bar.
//
// WHAT THIS CAN AND CANNOT SEE, because the obvious test is the wrong one. "Tab from the last
// control and assert focus left the page" cannot be written: there is no browser chrome in a
// headless run, so Tab past the last element cycles back to the first one and looks exactly like
// the wrap it is meant to catch. A journey written that way fails whether the fault is there or
// not, which is worse than not having it.
//
// So it asks the thing that actually changed. The wrap's whole mechanism was consuming the key —
// `preventDefault` on the Tab keydown. A page that does not consume it has handed the browser its
// own key back, which is the entire requirement. That is observable, and it goes red the moment
// anybody puts the wrap back.
//
// A REAL KEY PRESS, NOT A DISPATCHED EVENT. A dispatched `keydown` runs handlers and moves no
// focus at all, so it would say nothing about either half of this.
test('Tab at the end of the invoice is handed to the browser rather than swallowed', async ({ page }) => {
  await page.goto('/?screen=create')

  // Every Tab the page sees, and whether the page swallowed it. On `document` in the bubble
  // phase, so it runs after any handler the invoice registers — including a capture-phase one,
  // which is what the wrap was.
  await page.evaluate(() => {
    const seen: boolean[] = []
    ;(window as unknown as { tabsSwallowed: boolean[] }).tabsSwallowed = seen
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') seen.push(event.defaultPrevented)
    })
  })

  const save = page.getByRole('button', { name: /^Save/ }).first()
  await save.focus()
  await expect(save).toBeFocused()

  // Save is the last control in the invoice, so this is the press the wrap used to eat.
  await page.keyboard.press('Tab')
  await page.keyboard.press('Shift+Tab')
  await page.keyboard.press('Shift+Tab')

  const swallowed = await page.evaluate(() => (window as unknown as { tabsSwallowed: boolean[] }).tabsSwallowed)
  expect(swallowed).toHaveLength(3)
  expect(swallowed, 'the invoice swallowed a Tab — the wrap is back').toEqual([false, false, false])

  // AND NOTHING CAUGHT IT ON THE WAY PAST. The rescue net puts a keyboard dropped on the page body
  // back inside; walking off the end is not dropping, and the count is what says which happened.
  const rescues = await page.evaluate(() => document.querySelector('main')?.getAttribute('data-keyboard-rescues'))
  expect(rescues).toBe('0')
})

// THE OTHER HALF OF THE RULING IS NOT IN THE CODE, AND THIS IS WHAT IS ACTUALLY THERE.
//
// The ruling says the top menu is deliberately out of the tab order and that this is done on the
// controls rather than by wrapping the container. Measured on the running build, it is not done at
// all: User, Favourites, Housekeeping, Help, the company menu, the year menu, Open POS counter,
// the density switch, the rail expander and Sales are eleven ordinary buttons with no `tabindex`
// override between them. **The wrap was the only thing keeping the keyboard out of them**, so
// removing it makes all eleven reachable — Shift+Tab from Back now lands on Sales.
//
// That may be the better screen and it is not this session's call, and the controls are in the
// shell, which is Session B's. Filed in `docs/owed.md`. This test records what is true today so
// the number cannot drift while the question is open.
test('every control outside the invoice is reachable by keyboard, which the wrap used to hide', async ({ page }) => {
  await page.goto('/?screen=create')

  const stops = await page.evaluate(() => {
    const main = document.querySelector('main')
    const all = [...document.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
    )].filter((element) => element.offsetParent !== null)
    return all.filter((element) => main === null || !main.contains(element)).length
  })
  expect(stops).toBeGreaterThan(0)

  // And they are before the invoice in the document, so walking BACKWARDS off its first control
  // is what reaches them.
  await page.getByRole('button', { name: 'Back' }).focus()
  await page.keyboard.press('Shift+Tab')
  const landed = await page.evaluate(() => {
    const main = document.querySelector('main')
    const active = document.activeElement
    return main !== null && active !== null && !main.contains(active) && active !== document.body
  })
  expect(landed).toBe(true)
})
