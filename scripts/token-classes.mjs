// Which utility classes the source types, and which of them Tailwind actually built.
//
// Turning Tailwind's own palette off is silent on its own: bg-red-500 simply stops being
// generated and the element renders with no background, exactly as a typo would. The
// specification is explicit that the loudness has to come from a rule that rejects unknown
// utility classes, so this is that rule. It also catches every misspelling of a token name,
// which is the same failure wearing a different hat.

import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

import { sourceFiles } from './source-files.mjs'

const STYLESHEET = 'apps/magic/src/index.css'

/** Compiles the real stylesheet against the real sources and returns the CSS. */
export function compiledCss() {
  const out = join(mkdtempSync(join(tmpdir(), 'busy-tokens-')), 'out.css')
  execFileSync('npx', ['@tailwindcss/cli', '-i', STYLESHEET, '-o', out], { stdio: 'pipe' })
  return readFileSync(out, 'utf8')
}

/**
 * Which of these class names Tailwind would actually build if somebody typed them.
 *
 * It ASKS TAILWIND rather than reading our source, because the question is not "did we author
 * a utility" — it is "is there a name a person can type". Those came apart three times: a
 * token with no class at all, and a class that built from Tailwind's own default while our
 * token sat unused beside it. `compiledCss()` cannot answer this, because it only ever emits
 * the classes the product happens to use already.
 */
export function classesThatBuild(names) {
  const room = mkdtempSync(join(tmpdir(), 'busy-typeable-'))
  const uses = join(room, 'probe.html')
  const sheet = join(room, 'probe.css')
  const out = join(room, 'out.css')

  writeFileSync(uses, `<div class="${names.join(' ')}"></div>`)
  writeFileSync(sheet, `@import '${resolve(STYLESHEET)}';\n@source '${uses}';\n`)
  execFileSync('npx', ['@tailwindcss/cli', '-i', sheet, '-o', out], { stdio: 'pipe' })

  const css = readFileSync(out, 'utf8')
  return new Set(names.filter((name) => new RegExp(`\\.${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![\\w-])`).test(css)))
}

const CLASS_ATTRIBUTE = /className=(?:"([^"]*)"|\{'([^']*)'\})/g
const QUOTED = /'([^'\n]*)'|"([^"\n]*)"/g
const TEMPLATE = /`([^`]*)`/g

// A component's classes are not all in a className attribute. shadcn declares its inside a
// cva() call; this codebase builds some as template literals assigned to a variable and then
// handed to className. A rule that only read className let `h-row` through — a utility nobody
// had authored — and the grid rows had no height for a day.
function callBodies(text, name) {
  const bodies = []
  const open = `${name}(`
  let at = text.indexOf(open)
  while (at !== -1) {
    let depth = 0
    let index = at + open.length - 1
    for (; index < text.length; index += 1) {
      if (text[index] === '(') depth += 1
      else if (text[index] === ')') {
        depth -= 1
        if (depth === 0) break
      }
    }
    bodies.push(text.slice(at + open.length, index))
    at = text.indexOf(open, index)
  }
  return bodies
}

/** A template literal with its ${...} holes removed, so only the fixed text is read. */
function templateStrings(text) {
  return [...text.matchAll(TEMPLATE)].map(([, body]) => (body ?? '').replace(/\$\{[^}]*\}/g, ' '))
}

export function usedClasses(css) {
  const uses = new Map()

  // A string is treated as a list of classes only when MOST of its words are classes Tailwind
  // really built. That is what separates `flex h-row items-stretch` from an id like
  // `item-list-`, and — the part the first version got wrong — from PROSE.
  //
  // "At least two real classes" was the old rule, and any long enough sentence clears it by
  // accident: `block`, `grid`, `table`, `fixed`, `static` and `inline` are all ordinary English
  // words AND real Tailwind classes. A paragraph in a template literal therefore looked like a
  // class list, and every other word in it was reported as a class that does not exist. It only
  // bit on long strings, which is exactly where prose lives.
  //
  // A proportion cannot be fooled that way: a comment is mostly words, a class list is
  // essentially all classes.
  const MOSTLY = 0.7
  const looksLikeClasses = (value) => {
    const words = value.split(/\s+/).filter(Boolean)
    if (words.length === 0) return false
    const real = words.filter((word) => css === undefined || isGenerated(css, word)).length
    if (words.length === 1) return real === 1
    return real >= 2 && real / words.length >= MOSTLY
  }

  const record = (value, file, guarded) => {
    if (guarded && !looksLikeClasses(value)) return
    for (const name of value.split(/\s+/).filter(Boolean)) {
      if (!uses.has(name)) uses.set(name, file)
    }
  }

  for (const file of sourceFiles(['.tsx'])) {
    const text = readFileSync(file, 'utf8')

    for (const [, doubleQuoted, singleQuoted] of text.matchAll(CLASS_ATTRIBUTE)) {
      record(doubleQuoted ?? singleQuoted ?? '', file, false)
    }

    // cva() AND cn(). Reading only className and cva left a third door open: a bare quoted
    // string inside cn() — `stuck && 'shadow-sm'` — which is how half this codebase writes a
    // conditional class. `shadow-sm` sat there after the class stopped existing, so the one
    // shadow in the product was silently not being drawn, and the gate had nothing to say.
    for (const whole of [...callBodies(text, 'cva'), ...callBodies(text, 'cn')]) {
      // defaultVariants names variants, not classes: { variant: 'primary', size: 'default' }.
      // Comments go first: these calls carry the reasoning for the classes in them, and a
      // quoted phrase inside a comment is prose, not a class list.
      const body = whole
        .replace(/\/\*[\s\S]*?\*\//g, ' ')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
        .replace(/defaultVariants\s*:\s*\{[^}]*\}/g, '')
      for (const match of body.matchAll(QUOTED)) {
        const after = body.slice(match.index + match[0].length).trimStart()
        // An object key, not a class: `size: 'lg'`.
        if (after.startsWith(':')) continue
        // A value being COMPARED, not applied: `align === 'end' ? … : …`. Those are the
        // words a conditional class is chosen BY, and none of them is a class.
        const before = body.slice(0, match.index).trimEnd()
        if (/[=!]==?$/.test(before)) continue
        // A key being LOOKED UP, not a class: `ALIGN[column.align ?? 'start']`. The class is
        // whatever the table returns, and that table is scanned in its own right.
        if (after.startsWith(']')) continue
        record(match[1] ?? match[2] ?? '', file, false)
      }
    }

    for (const template of templateStrings(text)) record(template, file, true)
  }

  return uses
}

function selectorFor(className) {
  return className.replace(/[^A-Za-z0-9_-]/g, (character) => `\\${character}`)
}

// Tailwind's two marker classes. They are real and they are correct to type, but they emit
// no rule of their own — a variant elsewhere reads them. Everything else must be in the CSS.
const MARKERS = new Set(['group', 'peer'])

function isGenerated(css, className) {
  if (MARKERS.has(className)) return true
  const selector = selectorFor(className).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\.${selector}(?![A-Za-z0-9_-])`).test(css)
}

export function unknownClasses(css, uses) {
  const missing = []
  for (const [name, file] of uses) {
    if (!isGenerated(css, name)) missing.push({ name, file })
  }
  return missing
}
