// `filled` has to actually change what is drawn.
//
// A prop that is accepted and ignored is a control reporting a state it is not in — and the
// favourite star is exactly that case: added and not-added must not look identical. This asks
// the DRAWN PATH rather than the prop, because the prop being passed proves nothing about what
// reached the screen.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { Icon } from './Icon'
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

const drawn = async (node: React.ReactNode) => {
  const at = document.createElement('div')
  host.appendChild(at)
  mounted(at, node)
  await settled(() => at.querySelector('svg') !== null)
  return at.querySelector('svg')!.innerHTML
}

describe('a filled icon', () => {
  it('draws something different from the outline of the same icon', async () => {
    const off = await drawn(<Icon name="star" />)
    const on = await drawn(<Icon name="star" filled />)
    expect(off.length).toBeGreaterThan(0)
    expect(on).not.toBe(off)
  })

  it('is off unless it is asked for, so nothing becomes filled by accident', async () => {
    expect(await drawn(<Icon name="bell" />)).toBe(await drawn(<Icon name="bell" filled={false} />))
  })
})
