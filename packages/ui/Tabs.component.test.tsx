// Keyboard is how this product is actually used, so the strip's keyboard behaviour is the
// test rather than a paragraph. Three claims: the whole strip is one tab stop, the arrow keys
// move the choice and carry the keyboard with them, and the group wraps rather than
// dead-ending at either edge.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { Tabs, type TabOption } from './Tabs'

type Status = 'all' | 'pend' | 'over'

const OPTIONS: TabOption<Status>[] = [
  { value: 'all', label: 'All', count: 22 },
  { value: 'pend', label: 'Pending', count: 6 },
  { value: 'over', label: 'Overdue', count: 4 },
]

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

/** The strip, rendered with a real parent holding the value, because a radio group whose
 * value never changes cannot show that the keyboard follows the choice. */
function mount() {
  const at = document.createElement('div')
  host.appendChild(at)
  let value: Status = 'all'

  const strip = () => (
    <Tabs
      options={OPTIONS}
      value={value}
      onChange={(next) => {
        value = next
        draw()
      }}
      label="Invoice status"
    />
  )

  const draw = () => root.render(strip())
  const root = mounted(at, strip())

  return {
    at,
    /** Waits until the strip is on the screen with every option drawn. */
    ready: () => settled(() => at.querySelectorAll('button').length === OPTIONS.length),
    chosen: () => at.querySelector<HTMLButtonElement>('[aria-checked="true"]')!,
    named: (label: string) =>
      [...at.querySelectorAll('button')].find((button) => button.textContent?.startsWith(label))!,
  }
}

async function press(key: string, landsOn: () => Element | null | undefined) {
  document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }))
  // The strip re-renders and then moves the keyboard on the next frame, so the barrier is
  // "the keyboard has arrived", not two frames and a hope.
  await settled(() => document.activeElement === landsOn())
}

describe('the status strip', () => {
  it('is one tab stop for the whole group, not one per option', async () => {
    const strip = mount()
    await strip.ready()

    const reachable = [...strip.at.querySelectorAll('button')].filter((button) => button.tabIndex === 0)
    expect(reachable).toHaveLength(1)
    expect(reachable[0]!.getAttribute('aria-checked')).toBe('true')
  })

  it('moves the choice on the arrow keys and takes the keyboard with it', async () => {
    const strip = mount()
    await strip.ready()
    strip.chosen().focus()

    await press('ArrowRight', () => strip.named('Pending'))

    expect(strip.chosen().textContent).toContain('Pending')
    expect(document.activeElement).toBe(strip.named('Pending'))
  })

  it('wraps from the last option round to the first instead of dead-ending', async () => {
    const strip = mount()
    await strip.ready()
    strip.named('All').focus()

    await press('ArrowLeft', () => strip.named('Overdue'))

    expect(strip.chosen().textContent).toContain('Overdue')
  })

  it('says what it is choosing, so the option is not read out on its own', async () => {
    const strip = mount()
    await strip.ready()

    const group = strip.at.querySelector('[role="radiogroup"]')!
    expect(group.getAttribute('aria-label')).toBe('Invoice status')
  })
})
