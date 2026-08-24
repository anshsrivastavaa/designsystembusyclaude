// Each claim here is a way an anchored surface goes wrong in a real screen rather than in a
// story: it runs off the bottom of the window, it hangs off the side, Escape closes the thing
// behind it as well, the keyboard is stranded when it shuts, and it dismisses itself out from
// under the button that was being pressed.
//
// The edge test first PASSED with the clamp removed, which means it proved nothing: the
// harness put the trigger far enough in that the panel never wanted to overflow. It now puts
// it hard against the right edge, and without the clamp reads "expected 616 to be less than
// or equal to 414".

import { useRef, useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import '@busy/ui/styles.css'
import { mounted, unmountAll } from './mounted'
import { Popover } from './Popover'
import { settled } from './settled'

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

// UNMOUNT, DO NOT RIP OUT. This first removed the panel nodes by hand, which tears a portal's
// DOM out from under React — it then tries to remove the same node and the run fills up with
// "removeChild: the node to be removed is not a child of this node". Unmounting the root is
// how a portal is taken down, and it leaves nothing behind for the next test to trip on.
afterEach(() => {
  unmountAll()
  host.remove()
})

/** A trigger placed exactly where the test wants it, and the panel it opens. */
function Harness({ top, align, tall, edge }: { top: number; align?: 'start' | 'end'; tall?: boolean; edge?: boolean }) {
  const button = useRef<HTMLButtonElement>(null)
  const [showing, setShowing] = useState(false)

  return (
    <div>
      <button
        ref={button}
        type="button"
        data-role="trigger"
        style={{
          position: 'fixed',
          top,
          left: align === 'end' || edge === true ? window.innerWidth - 40 : 20,
          width: 32,
        }}
        onClick={() => setShowing(true)}
      >
        Open
      </button>
      <Popover open={showing} onClose={() => setShowing(false)} anchorRef={button} label="Menu" {...(align ? { align } : {})}>
        <div style={{ height: tall === true ? 300 : 80, width: 240 }}>
          <button type="button" data-role="inside">
            Print
          </button>
        </div>
      </Popover>
    </div>
  )
}

const panel = () => document.querySelector<HTMLElement>('[role="dialog"]')

async function open(node: React.ReactNode) {
  const at = document.createElement('div')
  host.appendChild(at)
  mounted(at, node)
  await settled(() => at.querySelector('[data-role="trigger"]') !== null)
  at.querySelector<HTMLButtonElement>('[data-role="trigger"]')!.click()
  await settled(() => panel() !== null)
  return { at, trigger: at.querySelector<HTMLButtonElement>('[data-role="trigger"]')! }
}

describe('the Popover', () => {
  it('flips above its anchor rather than running off the bottom of the window', async () => {
    // A tall panel on a trigger near the foot of the window: below does not fit.
    await open(<Harness top={window.innerHeight - 60} tall />)

    const box = panel()!.getBoundingClientRect()
    expect(box.bottom).toBeLessThanOrEqual(window.innerHeight)
    expect(box.top).toBeGreaterThanOrEqual(0)
  })

  it('lines its right edge up with the anchor when asked, so a kebab opens leftwards', async () => {
    await open(<Harness top={100} align="end" />)

    const box = panel()!.getBoundingClientRect()
    const trigger = document.querySelector<HTMLElement>('[data-role="trigger"]')!.getBoundingClientRect()

    expect(box.right).toBeCloseTo(trigger.right, 0)
    expect(box.left).toBeGreaterThanOrEqual(0)
  })

  it('pulls back from the window edge rather than hanging off it', async () => {
    // A left-aligned panel on a trigger hard against the right edge wants to start where
    // there is no room for it. Without the clamp this runs 200-odd pixels off the screen.
    await open(<Harness top={100} edge />)

    const box = panel()!.getBoundingClientRect()
    expect(box.right).toBeLessThanOrEqual(window.innerWidth)
    expect(box.left).toBeGreaterThanOrEqual(0)
  })

  it('closes on Escape without letting the key reach whatever is behind it', async () => {
    let behind = 0
    document.addEventListener('keydown', () => { behind += 1 })

    await open(<Harness top={100} />)
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settled(() => panel() === null)

    expect(panel()).toBe(null)
    // The listener above is on the same target the popover listens on, in the bubble phase.
    // The popover captures, so it stops the key before anything behind it hears it.
    expect(behind).toBe(0)
  })

  it('gives the keyboard back to the control that opened it', async () => {
    const { trigger } = await open(<Harness top={100} />)

    // It went in first, or the panel would be something you tab past on the way down.
    expect(panel()!.contains(document.activeElement)).toBe(true)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await settled(() => document.activeElement === trigger)

    expect(document.activeElement).toBe(trigger)
  })

  it('does not close when the pointer goes down inside it', async () => {
    await open(<Harness top={100} />)

    panel()!
      .querySelector<HTMLButtonElement>('[data-role="inside"]')!
      .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await settled()

    expect(panel()).not.toBe(null)
  })

  it('closes when the pointer goes down anywhere else', async () => {
    await open(<Harness top={100} />)

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))
    await settled(() => panel() === null)

    expect(panel()).toBe(null)
  })
})
