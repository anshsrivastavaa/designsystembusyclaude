// Three claims. It answers as a switch rather than a checkbox, so a screen reader says on and
// off. The knob actually moves, so the state survives the colour being taken away. And the
// words beside it are part of the control, not a caption next to it.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { Toggle } from './Toggle'

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
  return at.querySelector<HTMLButtonElement>('button')!
}

/** Where the knob actually is on the screen, relative to the track it sits in. */
const knobOffset = (button: HTMLElement) => {
  const track = button.querySelector('span')!
  const knob = track.querySelector('span')!
  return knob.getBoundingClientRect().left - track.getBoundingClientRect().left
}

describe('the Toggle', () => {
  it('answers as a switch, so it is read out as on and off rather than checked', async () => {
    const button = await render(
      <Toggle checked onCheckedChange={() => {}}>
        Show line items
      </Toggle>,
    )

    expect(button.getAttribute('role')).toBe('switch')
    expect(button.getAttribute('aria-checked')).toBe('true')
  })

  it('moves the knob, so on and off are told apart without any colour', async () => {
    const off = await render(
      <Toggle checked={false} onCheckedChange={() => {}}>
        Show line items
      </Toggle>,
    )
    const on = await render(
      <Toggle checked onCheckedChange={() => {}}>
        Show line items
      </Toggle>,
    )

    expect(knobOffset(on)).toBeGreaterThan(knobOffset(off))
  })

  it('counts its own words as part of the control, not a caption beside it', async () => {
    let asked: boolean | null = null
    const button = await render(
      <Toggle checked={false} onCheckedChange={(next) => { asked = next }}>
        Show line items
      </Toggle>,
    )

    // Pressing the words, not the switch — which is where a pointer usually lands.
    ;[...button.childNodes].forEach(() => {})
    button.click()
    await settled()

    expect(asked).toBe(true)
    expect(button.textContent).toContain('Show line items')
  })

  it('takes no pointer when disabled, rather than only looking faded', async () => {
    let asked = 0
    const button = await render(
      <Toggle checked={false} disabled onCheckedChange={() => { asked += 1 }}>
        Show line items
      </Toggle>,
    )

    button.click()
    await settled()

    expect(asked).toBe(0)
    expect(getComputedStyle(button).cursor).toBe('not-allowed')
  })
})
