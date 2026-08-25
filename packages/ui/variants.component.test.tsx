// The browser half of the variant gate: render every declared value, compare what is drawn.
// WHY it works this way — what counts as a variant, why the signature is style and geometry and
// never markup, and what each of those choices was learned from — is in variants.ts, beside the
// reader, so the reasoning has one home rather than two.

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as React from 'react'

import '@busy/ui/styles.css'
import { Button } from './Button'
import { Chip } from './Chip'
import { Disclosure } from './Disclosure'
import { MenuRow } from './MenuRow'
import { Popover } from './Popover'
import { Select } from './Select'
import { Shortcut } from './Shortcut'
import { TableHeading } from './TableHeading'
import { TextField } from './TextField'
import { mounted, unmountAll } from './mounted'
import { settled } from './settled'
import { SAME_AS_BASE, variantsIn, type Variant } from './variants'
import { Tabs } from './Tabs'

/** Every component source, as text, so the variants are read from the same file the component is
 *  compiled from. Vite resolves this at build time; nothing reads the disk at run time. */
const SOURCES = import.meta.glob('./*.tsx', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** How to render each component that declares a variant, and where to look for the difference.
 *  `at` picks the element the variant is supposed to change — the outermost node is not always
 *  the one wearing it. */
const RECIPES: Record<string, { render: (props: Record<string, unknown>) => React.ReactNode; at?: string }> = {
  Button: { render: (props) => <Button {...props}>Save</Button> },
  Chip: { render: (props) => <Chip {...props}>Paid</Chip> },
  Disclosure: {
    render: (props) => (
      <Disclosure summary="Breakdown" {...props}>
        content
      </Disclosure>
    ),
    at: 'button',
  },
  MenuRow: { render: (props) => <MenuRow {...props}>Current FY</MenuRow>, at: 'button' },
  Popover: {
    // A POPOVER NEEDS A REAL ANCHOR OR ITS ALIGNMENT IS UNTESTABLE. With a null anchorRef it sits
    // unpositioned at the origin, and `start` and `end` render identically — which would have read
    // as "align changes nothing" and been wrong about a variant that works. The anchor is put on
    // the page at a known place and the panel measured against it.
    render: (props) => <PopoverExample {...props} />,
    at: '[data-slot="popover"]',
  },
  Select: {
    render: (props) => (
      <Select
        label="Rows per page"
        value="50"
        onChange={() => {}}
        options={[
          { value: '25', label: '25' },
          { value: '50', label: '50' },
        ]}
        {...props}
      />
    ),
  },
  Shortcut: { render: (props) => <Shortcut keyName="F2" {...props} /> },
  TableHeading: {
    render: (props) => (
      <table>
        <thead>
          <tr>
            <TableHeading {...props}>Date</TableHeading>
          </tr>
        </thead>
      </table>
    ),
    at: 'th, div',
  },
  TextField: { render: (props) => <TextField value="1,250.00" onChange={() => {}} {...props} /> },
  Tabs: {
    render: (props) => (
      <Tabs
        label="Density"
        value="a"
        onChange={() => {}}
        options={[
          { value: 'a', label: 'Standard' },
          { value: 'b', label: 'Large' },
        ]}
        {...props}
      />
    ),
  },
}

function PopoverExample(props: Record<string, unknown>) {
  const anchor = React.useRef<HTMLButtonElement>(null)
  const [ready, setReady] = React.useState(false)
  React.useEffect(() => setReady(true), [])

  return (
    // A WIDE ANCHOR AND A NARROW PANEL, SIZED AGAINST THE WINDOW RATHER THAN IN PIXELS.
    //
    // The first version put a wide panel against a narrow anchor and both alignments came back at
    // the same left, because the panel did not fit and the popover's viewport clamp placed it
    // identically either way — the gate read a working variant as dead. The second version fixed
    // that with pixel geometry that happened to fit THIS machine's window, passed here, and failed
    // on the CI runner, whose window is a different size. A check that depends on the box it runs
    // on is worse than one that is merely wrong, because it is only wrong somewhere else.
    //
    // Percentages of the window cannot collide: the anchor is most of the width, the panel is a
    // small fixed box, so `start` and `end` are always most of a window apart wherever this runs.
    <div style={{ position: 'fixed', left: '5%', top: '20%', width: '70%' }}>
      <button ref={anchor} type="button" style={{ width: '100%', height: 30 }}>
        Period
      </button>
      {ready ? (
        <Popover open onClose={() => {}} anchorRef={anchor} label="Period" {...props}>
          <div style={{ width: 60, height: 40 }}>rows</div>
        </Popover>
      ) : null}
    </div>
  )
}

const DECLARED: Variant[] = Object.entries(SOURCES)
  .map(([path, text]) => [path.replace('./', '').replace('.tsx', ''), text] as const)
  .filter(([name]) => !name.includes('.stories') && !name.includes('.test'))
  .flatMap(([name, text]) => variantsIn(name, text))

let host: HTMLDivElement

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
})

afterEach(() => {
  unmountAll()
  host.remove()
})

/** How the whole subtree is drawn — every element's computed style and where it ended up.
 *  The three things that signature had to learn are recorded in variants.ts. */
async function drawnAs(node: React.ReactNode, at?: string) {
  const mountPoint = document.createElement('div')
  host.appendChild(mountPoint)
  mounted(mountPoint, node)
  // A portal draws outside the mount point, so the panel is looked for in the document when the
  // subtree does not hold it — and the wait is for the thing being MEASURED, not for the mount
  // point to have a child. Waiting on the child made every portalled case time out, and the
  // failure read as a broken recipe rather than as a wait pointed at the wrong element.
  // THE LAST ONE, NOT THE FIRST. Two renders happen inside one case — the base and the value —
  // and a portalled panel from the first is still on the page when the second mounts, so
  // `document.querySelector` kept handing back the older panel. The two measurements then
  // compared one element against itself in one direction and against a stale one in the other.
  const find = () =>
    at === undefined
      ? mountPoint.firstElementChild
      : (mountPoint.querySelector(at) ?? [...document.querySelectorAll(at)].pop() ?? null)

  await settled(() => find() !== null)
  const root = find()
  if (root === null) throw new Error(`nothing matched ${at ?? 'the root'}`)

  // AND THEN WAIT UNTIL IT HAS STOPPED MOVING. A popover mounts at the origin, invisible, and
  // places itself once it has measured the anchor — so "the element exists" is a frame or two
  // before "the element is where it is going to be". Measured at the wrong moment, two different
  // alignments both read as 0,0 and the gate called a working variant dead.
  let previous = ''
  for (let frame = 0; frame < 30; frame += 1) {
    const now = JSON.stringify(root.getBoundingClientRect())
    if (now === previous) break
    previous = now
    await new Promise((next) => requestAnimationFrame(() => next(null)))
  }

  const origin = root.getBoundingClientRect()
  const of = (element: Element) => {
    const style = getComputedStyle(element)
    const box = element.getBoundingClientRect()
    const where = [
      Math.round(box.left - origin.left),
      Math.round(box.top - origin.top),
      Math.round(box.width),
      Math.round(box.height),
    ].join(',')
    // REAL PROPERTIES ONLY, AND IN A FIXED ORDER. `Array.from(style)` includes every CSS custom
    // property inherited from the root — the whole token layer, on every element — and does not
    // enumerate them in a stable order, so two identical renders produced two different strings
    // and the comparison was a coin toss. Custom properties are also never what a variant
    // changes: they are the same on both sides by definition.
    const drawn = Array.from(style)
      .filter((property) => !property.startsWith('--'))
      .sort()
      .map((property) => `${property}: ${style.getPropertyValue(property)}`)
      .join(';')
    return `${where} ${drawn}`
  }

  // ELEMENTS THAT DRAW NOTHING ARE LEFT OUT. A zero-sized node has no appearance for a variant to
  // change, and Chrome reports the rect of one inconsistently: an `<option>` inside a closed
  // `<select>` came back at top 0 in one render and top -32 in the next, purely because the two
  // mounts sat at different heights on the page. That made a stable comparison impossible for
  // every select in the library. A node that is still counted if it disappears — the line simply
  // goes missing, which is the difference the gate is looking for anyway.
  const drawn = [root, ...root.querySelectorAll('*')].filter((element) => {
    const box = element.getBoundingClientRect()
    return box.width > 0 || box.height > 0
  })

  return drawn.map(of).join('\n')
}

describe('every declared variant value', () => {
  it('has a way to render every component that declares one', () => {
    const withoutRecipe = [...new Set(DECLARED.map((each) => each.component))].filter(
      (component) => RECIPES[component] === undefined,
    )

    expect(withoutRecipe, 'add these to RECIPES, or the gate silently stops covering them').toEqual([])
  })

  it('found variants at all', () => {
    // A reader that matches nothing would make every case below vacuous, and the whole file would
    // report green having compared nothing — which is the failure this suite is named after.
    expect(DECLARED.length).toBeGreaterThan(5)
  })

  for (const { component, name, values } of DECLARED) {
    const recipe = RECIPES[component]
    if (recipe === undefined) continue

    for (const value of values) {
      const key = `${component}.${name}.${value}`
      const expected = SAME_AS_BASE[key]

      it(`${key} draws ${expected === undefined ? 'differently from' : 'the same as'} the base`, async () => {
        const base = await drawnAs(recipe.render({}), recipe.at)
        const withIt = await drawnAs(recipe.render({ [name]: value }), recipe.at)

        if (expected === undefined) {
          expect(withIt, `${key} changes nothing on the screen — ${name}="${value}" is not a variant`).not.toBe(base)
        } else {
          expect(withIt, `${key} is listed in SAME_AS_BASE: ${expected}`).toBe(base)
        }
      })
    }
  }
})
