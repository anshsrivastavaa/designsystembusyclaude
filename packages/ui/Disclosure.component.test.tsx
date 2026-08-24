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

  it('label becomes the accessible name when the summary is not the whole story', async () => {
    const at = await render(
      <Disclosure summary="Breakdown" label="Hide the breakdown" defaultOpen>
        x
      </Disclosure>,
    )

    expect(at.querySelector('button')!.getAttribute('aria-label')).toBe('Hide the breakdown')
  })
})
