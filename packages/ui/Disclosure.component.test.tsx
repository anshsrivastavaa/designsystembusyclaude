// EVERY PROP THIS COMPONENT DECLARES, ASSERTED AGAINST THE RENDERING.
//
// Written because of `Button`'s `shape`: declared in the variants, typed on the props, passed
// correctly at every call site — and never destructured, so it was spread onto the element as an
// HTML attribute and did nothing at all. TypeScript was green and the screen drew a 6px corner
// where a circle was asked for. A prop is a promise about the rendering, so what proves it is a
// measurement of the rendering.
//
// Nothing here reads a class name. `rotate-180` being present says what somebody meant; the
// computed rotation says what the chevron is actually doing.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type * as React from 'react'

import '@busy/ui/styles.css'
import { Disclosure } from './Disclosure'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

async function render(node: React.ReactNode) {
  const at = document.createElement('div')
  host.appendChild(at)
  mounted(at, node)
  await settled(() => at.querySelector('button') !== null)
  return at
}

describe('Disclosure', () => {
  it('renders nothing of its contents while it is closed', async () => {
    const at = await render(
      <Disclosure summary="Tax summary">
        <p>Eighteen per cent on nine thousand</p>
      </Disclosure>,
    )

    expect(at.textContent).not.toContain('Eighteen per cent')
    expect(at.querySelector('button')!.getAttribute('aria-expanded')).toBe('false')
  })

  it('defaultOpen reaches the rendering', async () => {
    const at = await render(
      <Disclosure summary="Breakdown" defaultOpen>
        <p>Eighteen per cent on nine thousand</p>
      </Disclosure>,
    )

    expect(at.textContent).toContain('Eighteen per cent')
    expect(at.querySelector('button')!.getAttribute('aria-expanded')).toBe('true')
  })

  it('the chevron is turned over when it is open, measured as a rotation', async () => {
    const shut = await render(<Disclosure summary="Narration">content</Disclosure>)
    const openOne = await render(
      <Disclosure summary="Narration" defaultOpen>
        content
      </Disclosure>,
    )

    // THE PROPERTY IS `rotate`, NOT `transform`. Tailwind v4 writes `rotate-180` to the
    // standalone `rotate` property, and `transform` stays empty — so the first version of this
    // test read `transform`, got nothing, and would have gone on reading nothing however the
    // chevron behaved. The four hand-written copies of this header use the same class, so any
    // test written against them would have measured the same empty string.
    const markOf = (at: HTMLElement) => getComputedStyle(at.querySelector('svg')!).rotate

    expect(markOf(shut)).toBe('none')
    expect(markOf(openOne)).toBe('180deg')
  })

  it('closedAside shows only while it is closed', async () => {
    const shut = await render(
      <Disclosure summary="Narration" closedAside="Delivered to the Nashik godown">
        the whole note
      </Disclosure>,
    )
    const openOne = await render(
      <Disclosure summary="Narration" closedAside="Delivered to the Nashik godown" defaultOpen>
        the whole note
      </Disclosure>,
    )

    expect(shut.textContent).toContain('Nashik godown')
    expect(openOne.textContent).not.toContain('Nashik godown')
  })

  it('tone reaches the rendering as a different ink', async () => {
    const heading = await render(<Disclosure summary="Breakdown">x</Disclosure>)
    const accent = await render(
      <Disclosure summary="More fields" tone="accent">
        x
      </Disclosure>,
    )

    const inkOf = (at: HTMLElement) => getComputedStyle(at.querySelector('button')!).color
    expect(inkOf(accent)).not.toBe(inkOf(heading))
  })

  it('open wins over its own state, and the caller is told', async () => {
    const told: boolean[] = []
    const at = await render(
      <Disclosure summary="Breakdown" open={false} onOpenChange={(next) => told.push(next)}>
        <p>Eighteen per cent</p>
      </Disclosure>,
    )

    at.querySelector('button')!.click()
    await settled(() => told.length > 0)

    // It asked to be opened, and stayed shut, because the caller holds the answer.
    expect(told).toEqual([true])
    expect(at.textContent).not.toContain('Eighteen per cent')
  })

  it('flush takes the padding off the body, so a full-bleed table meets the card', async () => {
    const padded = await render(
      <Disclosure summary="Tax summary" defaultOpen>
        <p>rows</p>
      </Disclosure>,
    )
    const bare = await render(
      <Disclosure summary="Tax summary" flush defaultOpen>
        <p>rows</p>
      </Disclosure>,
    )

    // MEASURED AS A NUMBER, NOT MATCHED AS A STRING. A pixel literal in a test is a second copy
    // of a token value — it goes stale the day the token moves, and the raw-pixel gate is right
    // to refuse it. What this claims is "some padding" against "none", which is a comparison.
    const padOf = (at: HTMLElement) =>
      Number.parseFloat(getComputedStyle(at.querySelector('button + div')!).paddingLeft)

    expect(padOf(padded)).toBeGreaterThan(0)
    expect(padOf(bare)).toBe(0)
  })

  it('bodyClassName replaces the padding rather than adding to it', async () => {
    const at = await render(
      <Disclosure summary="Breakdown" bodyClassName="px-6" defaultOpen>
        <p>rows</p>
      </Disclosure>,
    )

    // The breakdown's body is already aligned to the card's own padding; the component's own
    // would indent it a second time, which is the fault this prop exists to stop. Compared
    // against what the component gives by default rather than against a typed number.
    const byDefault = await render(
      <Disclosure summary="Breakdown" defaultOpen>
        <p>rows</p>
      </Disclosure>,
    )
    const padOf = (where: HTMLElement) =>
      Number.parseFloat(getComputedStyle(where.querySelector('button + div')!).paddingLeft)

    expect(padOf(at)).toBeGreaterThan(padOf(byDefault))
  })

  it('label becomes the accessible name when the summary is not the whole story', async () => {
    const at = await render(
      <Disclosure summary="Breakdown" label="Hide the breakdown" defaultOpen>
        x
      </Disclosure>,
    )

    expect(at.querySelector('button')!.getAttribute('aria-label')).toBe('Hide the breakdown')
  })
})
