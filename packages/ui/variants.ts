// ONE GATE FOR THE WHOLE LIBRARY: every declared variant value draws differently from the base.
//
// This file is the reader. The rendering and the comparison are in variants.component.test.tsx,
// where there is a real browser to ask.
//
// `Button` grew a `shape` variant — declared, typed, passed correctly at every call site, and
// never destructured, so it was spread onto the element as an HTML attribute nobody reads.
// TypeScript was green, every caller was right, and the screen drew a six-pixel corner where a circle
// was asked for. The obvious response was a test for `shape`, and that is the response that lets
// it happen again on the next prop: even after the fix, `shape="round"` had no assertion on its
// corner anywhere in this repository.
//
// So this does not name a prop. It reads every variant every component declares, straight out of
// the sources, renders each value, and asks the browser whether anything about the element
// actually changed. It catches the next one nobody thought to write a test for, which is the only
// kind that has ever shipped.
//
// THE LIST OF VARIANTS IS DERIVED. The list of how to RENDER each component cannot be — a
// component needs its required props — so that one is written below, and a component that
// declares a variant and has no recipe FAILS rather than being quietly skipped. That is the
// difference between a list that can go stale and one that cannot.

// WHAT COUNTS AS A DECLARED VARIANT, read out of a component's own source.
//
// Two shapes, because this library has two. `cva` components declare a `variants: {}` block;
// hand-written ones declare a prop typed as a union of string literals. Both are a promise that
// passing a value changes what is drawn, and the gate that checks that promise has to see both —
// the first version of this read only the cva blocks and found eleven values in one component
// while missing `Tabs look`, `Disclosure tone`, `Disclosure chevron` and `TableRowActions as`.
//
// IT IS DERIVED, NEVER LISTED. A list of components and their variants is a second copy of what
// the source already says, and the day the two disagree is the day the gate goes quiet about
// whichever the list forgot.

/* How the whole subtree is DRAWN — every element's computed style and where it ended up.
 *
 * COMPUTED STYLE OF ONE ELEMENT IS NOT ENOUGH, and the first version of this found out on its
 * first run. `Disclosure chevron="trail"` moves the chevron from before the words to after them:
 * the button's computed style is identical, and so is the chevron's — what changes is where it
 * sits. `MenuRow kind="command"` drops the tick column and changes the ARIA role: again, no
 * computed style anywhere moves. Both are real variants and both looked like dead ones.
 *
 * MARKUP IS DELIBERATELY NOT IN THE SIGNATURE. The fault this gate exists for is a prop that
 * reached the element as an attribute and drew nothing — `<button shape="round">` with a six-pixel
 * corner. Comparing markup would have called that a difference and passed it. Style and geometry
 * are what a person sees; an attribute is not.*/

export type Variant = { component: string; name: string; values: string[] }

/** Values expected to draw the same as the base, with the reason. A default value IS the base,
 *  so comparing it against itself proves nothing either way. */
export const SAME_AS_BASE: Record<string, string> = {
  'Button.variant.primary': 'the default — it is what the base renders',
  'Button.size.default': 'the default — it is what the base renders',
  'Button.shape.control': 'the default — it is what the base renders',
  'Tabs.look.tray': 'the default — it is what the base renders',
  'Disclosure.tone.heading': 'the default — it is what the base renders',
  'Disclosure.chevron.lead': 'the default — it is what the base renders',
  'TableRowActions.as.td': 'the default — it is what the base renders',
  'MenuRow.kind.choice': 'the default — it is what the base renders',
  'Popover.align.start': 'the default — it is what the base renders',
  'Shortcut.tone.quiet': 'the default — it is what the base renders',
  'TableHeading.as.th': 'the default — it is what the base renders',
  'TableHeading.align.start': 'the default — it is what the base renders',
  'TextField.align.start': 'the default — it is what the base renders',
  'Select.size.default': 'the default — it is what the base renders',
}

/** The `variants: { name: { value: … } }` block of a cva call. */
function fromCva(text: string): Array<{ name: string; values: string[] }> {
  const found: Array<{ name: string; values: string[] }> = []
  const start = text.indexOf('variants: {')
  if (start === -1) return found

  // The braces are walked rather than matched, because a variant's value is a string that may
  // contain anything, including a brace inside an arbitrary Tailwind value.
  let depth = 0
  let end = text.length
  for (let at = text.indexOf('{', start); at < text.length; at += 1) {
    if (text[at] === '{') depth += 1
    else if (text[at] === '}') {
      depth -= 1
      if (depth === 0) {
        end = at
        break
      }
    }
  }

  for (const match of text.slice(start, end).matchAll(/(?:^|\n)\s{4,}'?([a-zA-Z][\w-]*)'?:\s*\{([\s\S]*?)\n\s{4,}\},/g)) {
    const name = match[1] ?? ''
    const values = [...(match[2] ?? '').matchAll(/(?:^|\n)\s+'?([a-zA-Z][\w-]*)'?:\s*['"`[]/g)]
      .map((each) => each[1] ?? '')
      .filter(Boolean)
    if (name !== '' && values.length > 0) found.push({ name, values })
  }
  return found
}

/** A prop typed as a union of string literals: `tone?: 'heading' | 'accent'`. Two or more, or it
 *  is not a choice. */
function fromProps(text: string): Array<{ name: string; values: string[] }> {
  const found: Array<{ name: string; values: string[] }> = []
  for (const match of text.matchAll(/(?:^|\n)\s+([a-zA-Z][\w]*)\??:\s*((?:'[\w-]+'\s*\|\s*)+'[\w-]+')/g)) {
    const name = match[1] ?? ''
    const values = [...(match[2] ?? '').matchAll(/'([\w-]+)'/g)].map((each) => each[1] ?? '').filter(Boolean)
    if (name !== '' && values.length > 1) found.push({ name, values })
  }
  return found
}

export function variantsIn(component: string, text: string): Variant[] {
  const byName = new Map<string, string[]>()
  for (const { name, values } of [...fromCva(text), ...fromProps(text)]) {
    byName.set(name, [...new Set([...(byName.get(name) ?? []), ...values])])
  }
  return [...byName].map(([name, values]) => ({ component, name, values }))
}
