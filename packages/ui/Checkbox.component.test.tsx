// The Checkbox exists at this step for one reason: a header tick over a part-selected page
// must not claim to be off. A control that reports a state it is not in is worse than no
// control, so the mixed state is asserted twice — once as the thing the browser draws, and
// once as the thing a screen reader is told. Those are two different mechanisms and either
// can be right while the other is wrong.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { Checkbox } from './Checkbox'
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
  const mount = document.createElement('div')
  host.appendChild(mount)
  mounted(mount, node)
  // Wait for the input to be on the screen, not for a length of time.
  await settled(() => mount.querySelector('input') !== null)
  return mount.querySelector('input')!
}

describe('the Checkbox', () => {
  it('draws mixed as neither on nor off, rather than falling back to off', async () => {
    const box = await render(<Checkbox mixed onChange={() => {}} aria-label="Select all" />)

    // `indeterminate` is what makes the browser paint a dash instead of a tick. It has no
    // attribute, so nothing in the markup would have set it — this is the ref doing its job.
    expect(box.indeterminate).toBe(true)
  })

  it('tells a screen reader mixed as well, not just the pixels', async () => {
    const box = await render(<Checkbox mixed onChange={() => {}} aria-label="Select all" />)

    expect(box.getAttribute('aria-checked')).toBe('mixed')
  })

  it('stops being mixed when the state resolves, instead of staying dashed forever', async () => {
    const mount = document.createElement('div')
    host.appendChild(mount)
    const root = mounted(mount, <Checkbox mixed onChange={() => {}} aria-label="Select all" />)

    await settled(() => mount.querySelector('input') !== null)
    expect(mount.querySelector('input')!.indeterminate).toBe(true)

    root.render(<Checkbox checked onChange={() => {}} aria-label="Select all" />)
    await settled(() => mount.querySelector('input')?.checked === true)
    const box = mount.querySelector('input')!
    expect(box.indeterminate).toBe(false)
    expect(box.getAttribute('aria-checked')).toBe('true')
  })

  it('wears our colour rather than the browser default blue', async () => {
    const box = await render(<Checkbox checked onChange={() => {}} aria-label="Pick" />)

    const bare = document.createElement('input')
    bare.type = 'checkbox'
    host.appendChild(bare)

    const ours = getComputedStyle(box).accentColor
    expect(ours).not.toBe(getComputedStyle(bare).accentColor)
    expect(ours).not.toBe('auto')
  })

  it('takes no pointer when disabled, rather than only looking faded', async () => {
    const box = await render(<Checkbox disabled onChange={() => {}} aria-label="Pick" />)

    expect(box.disabled).toBe(true)
    expect(getComputedStyle(box).cursor).toBe('not-allowed')
  })
})
