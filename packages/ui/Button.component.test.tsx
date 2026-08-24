// The Button's whole reason for existing at this step is that its size is a token that flips
// with density. That is asserted by measuring the rendered element, never by looking at a
// class name — a class name is a proxy for what you mean, not the thing.
//
// Nothing here restates a token's value. A test that says "32 pixels" is a second copy of
// the token, and it passes just as happily when the token is wrong. These assert the things
// the token cannot be trusted to keep true on its own: that density actually moves the size,
// and that comfortable clears the touch minimum, which is Apple's number and not ours.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { Button } from './Button'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'

const TOUCH_MINIMUM = 44

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

async function measure(density: string, node = <Button>Save invoice</Button>) {
  const mount = document.createElement('div')
  mount.setAttribute('data-density', density)
  host.appendChild(mount)
  mounted(mount, node)
  // Waits for the button to be ON THE SCREEN WITH A SIZE, not for a length of time. Height is
  // what every measurement below reads, and a tree that has mounted but not been laid out
  // reports zero — which is how this file flaked.
  await settled(() => (mount.querySelector('button')?.getBoundingClientRect().height ?? 0) > 0)
  const button = mount.querySelector('button')!
  const style = getComputedStyle(button)
  return {
    height: button.getBoundingClientRect().height,
    fontSize: Number.parseFloat(style.fontSize),
    background: style.backgroundColor,
    pointerEvents: style.pointerEvents,
  }
}

describe('the Button', () => {
  it('grows when the density changes, rather than staying one fixed size', async () => {
    const standard = await measure('standard')
    const comfortable = await measure('comfortable')

    expect(comfortable.height).toBeGreaterThan(standard.height)
    expect(comfortable.fontSize).toBeGreaterThan(standard.fontSize)
  })

  it('clears the minimum touch target at comfortable density', async () => {
    const comfortable = await measure('comfortable')
    expect(comfortable.height).toBeGreaterThanOrEqual(TOUCH_MINIMUM)
  })

  it('takes no pointer at all when disabled, rather than only looking faded', async () => {
    const disabled = await measure('standard', <Button disabled>Save invoice</Button>)
    expect(disabled.pointerEvents).toBe('none')
  })

  it('paints the quiet variant with no fill at rest', async () => {
    const ghost = await measure('standard', <Button variant="ghost">Add row</Button>)

    const bare = document.createElement('span')
    host.appendChild(bare)
    expect(ghost.background).toBe(getComputedStyle(bare).backgroundColor)
  })
})
