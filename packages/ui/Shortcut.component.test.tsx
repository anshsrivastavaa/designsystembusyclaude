// THE CAP, AS IT IS ACTUALLY DRAWN, ON BOTH KEYBOARDS.
//
// The mapping itself is covered as data in keyCaps.logic.test.ts. This is the other half and it is
// the half that has failed before in this repository: a function can be right while nothing calls
// it. So the browser is stood on each platform in turn and asked what the element says.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type * as React from 'react'

import '@busy/ui/styles.css'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { Shortcut } from './Shortcut'

let host: HTMLDivElement
let realPlatform: PropertyDescriptor | undefined

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  realPlatform = Object.getOwnPropertyDescriptor(Navigator.prototype, 'platform')
})

afterEach(() => {
  unmountAll()
  host.remove()
  if (realPlatform) Object.defineProperty(Navigator.prototype, 'platform', realPlatform)
})

/** Stand the browser on a keyboard. `userAgentData.platform` is read first where it exists, so
 *  both are set — otherwise the answer depends on which browser is running the suite. */
function standOn(platform: string) {
  Object.defineProperty(Navigator.prototype, 'platform', { value: platform, configurable: true })
  Object.defineProperty(navigator, 'userAgentData', {
    value: { platform },
    configurable: true,
  })
}

async function render(node: React.ReactNode) {
  const at = document.createElement('div')
  host.appendChild(at)
  mounted(at, node)
  await settled(() => at.querySelector('kbd') !== null)
  return at.querySelector<HTMLElement>('kbd')!
}

describe('a key cap', () => {
  it('says Option on a Mac', async () => {
    standOn('MacIntel')
    const cap = await render(<Shortcut keyName="Alt" />)

    expect(cap.textContent).toBe('Option')
  })

  it('says Alt on a PC', async () => {
    standOn('Win32')
    const cap = await render(<Shortcut keyName="Alt" />)

    expect(cap.textContent).toBe('Alt')
  })

  it('leaves a function key alone on both', async () => {
    standOn('MacIntel')
    expect((await render(<Shortcut keyName="F10" />)).textContent).toBe('F10')

    standOn('Win32')
    expect((await render(<Shortcut keyName="F10" />)).textContent).toBe('F10')
  })
})
