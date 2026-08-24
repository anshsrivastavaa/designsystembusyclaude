// The token gate group. Every check here reports how many things it looked at, and a check
// that looked at nothing fails — a group that runs zero and reports green is the exact
// failure this build is named after.

import { readFileSync } from 'node:fs'

import { declarations, buildDtcg, serialise, DTCG_PATH } from './token-dtcg.mjs'
import { classesThatBuild, compiledCss, usedClasses, unknownClasses } from './token-classes.mjs'
import { rawValueChecks } from './token-raw.mjs'
import { authoredUtilities, shadcnNamesOutsideTheBridge, BRIDGE_CSS } from './token-bridge.mjs'
import { sourceFiles } from './source-files.mjs'

const FAMILIES = ['surface', 'ink', 'stroke', 'accent', 'success', 'warning', 'danger', 'info', 'on']
const SEMANTIC_CSS = 'packages/tokens/semantic.css'
const UTILITIES_CSS = 'packages/tokens/utilities.css'
const CN_TS = 'packages/ui/cn.ts'

const semanticNames = () => declarations(SEMANTIC_CSS).map(({ name }) => name)
const colourNames = () => semanticNames().filter((name) => name.startsWith('--color-'))

function familyGrammar() {
  const names = colourNames()
  const wrong = names.filter((name) => !FAMILIES.includes(name.slice('--color-'.length).split('-')[0] ?? ''))
  return {
    rule: 'every --color-* names one of the nine families',
    counted: `${names.length} colour names`,
    failures: wrong.map((name) => `${name} — its family word is not one of ${FAMILIES.join(' ')}`),
  }
}

function utilityClasses() {
  const css = compiledCss()
  const uses = usedClasses(css)
  const unknown = unknownClasses(css, uses)
  return {
    rule: 'every utility class typed in the source is one Tailwind actually builds',
    counted: `${uses.size} classes`,
    failures: unknown.map(({ name, file }) => `${name} in ${file} — no such class is generated`),
  }
}

// EVERY AUTHORED UTILITY IS KNOWN TO tailwind-merge.
//
// tailwind-merge decides which property a class sets FROM ITS NAME, and our hand-authored
// utilities are names it has never seen. Unlisted, it reads `text-caps` as a text colour,
// decides it conflicts with `text-ink-secondary`, and drops it — silently, because the class IS
// typed in the source and DOES build, so every other check here is satisfied while the size
// never reaches the element.
//
// cn.ts carried a comment saying every authored utility was listed. It listed one of the six
// sizes, and text-caps, text-heading and text-title were each being dropped. A list that claims
// to be complete and has no check is a comment, not a rule.
function utilitiesAreKnownToTheMerger() {
  const authored = [...readFileSync(UTILITIES_CSS, 'utf8').matchAll(/@utility ([a-z0-9-]+)/g)].map(([, name]) => name)
  const merger = readFileSync(CN_TS, 'utf8')
  const missing = authored.filter((name) => !merger.includes(`'${name}'`))

  return {
    rule: `every utility authored in ${UTILITIES_CSS} is listed in ${CN_TS}`,
    counted: `${authored.length} utilities`,
    failures: missing.map(
      (name) => `${name} — tailwind-merge has never heard of it, so it will guess and may drop it`,
    ),
  }
}

// EVERY SCALE TOKEN HAS A CLASS SOMEBODY CAN TYPE — the fault that has now happened four
// times: --icon-sm and --icon-xl with no class at all; --font-size-sm/lg/heading/title with
// none, so `text-sm` quietly meant Tailwind's 14px in eighty-three places; --radius-control
// shadowed by Tailwind's --radius-md at the same 6px by coincidence; and --elevation-2,
// documented as "a popover or a menu", never used because `shadow-lg` was there instead.
//
// It checks the CLASS, not the token. A token is a decision nobody can act on until there is a
// name you can type, so a stop with no class never reached the screen at all.
const TYPEABLE = [
  { token: /^--font-size-(.+)$/, klass: (stop) => `text-${stop}` },
  { token: /^--icon-(.+)$/, klass: (stop) => `size-icon-${stop}` },
  { token: /^--radius-(.+)$/, klass: (stop) => `rounded-${stop}` },
  // Elevation names its job rather than its size, so the class is not a mechanical suffix.
  { token: /^--elevation-(.+)$/, klass: (stop) => ({ '1': 'shadow-raised', '2': 'shadow-popover', '3': 'shadow-dialog', drawer: 'shadow-drawer' })[stop] },
  // --motion-travel is deliberately absent: it is read by the keyframes and by nothing a screen
  // writes, so a class for it would be a name nobody should type.
  { token: /^--motion-(swift|glide|enter|leave)$/, klass: (stop) => `duration-${stop}` },
]

function everyScaleStopIsTypeable() {
  const declared = new Set()
  for (const file of sourceFiles(['.css'], {}).filter((path) => path.startsWith('packages/tokens/') && !path.includes('reference-old-build'))) {
    for (const [, name] of readFileSync(file, 'utf8').matchAll(/^\s*(--[a-z-]+)\s*:/gm)) declared.add(name)
  }

  const wanted = []
  for (const name of declared) {
    for (const { token, klass } of TYPEABLE) {
      const hit = token.exec(name)
      const wantedName = hit && hit[1] !== '*' ? klass(hit[1]) : undefined
      if (wantedName) wanted.push({ name, klass: wantedName })
    }
  }

  const built = classesThatBuild(wanted.map(({ klass }) => klass))
  return {
    rule: 'every stop on a scale has a class somebody can type',
    counted: `${wanted.length} stops`,
    failures: wanted
      .filter(({ klass }) => !built.has(klass))
      .map(({ name, klass }) => `${name} has no ${klass} — a token with no class is unwriteable, and the nearest default wins`),
  }
}

function dtcgMirror() {
  const expected = serialise(buildDtcg())
  const onDisk = readFileSync(DTCG_PATH, 'utf8')
  const generated = buildDtcg()
  const counted = Object.keys(generated.palette).length + Object.keys(generated.semantic).length
  return {
    rule: 'the DTCG JSON is a mirror of the token CSS',
    counted: `${counted} tokens`,
    failures:
      expected === onDisk
        ? []
        : [`${DTCG_PATH} does not match the CSS it is generated from — run npm run tokens:write`],
  }
}

// Written and proved now, switched on at step 4. Step 1 created 23 semantic names and no
// component exists until Create Invoice, so on the day this landed all 23 would go red at
// once. Run it with TOKEN_ZERO_USE=on to watch it work. Scale steps are deliberately not
// its business: --neutral-4 with nothing pointing at it means no semantic name needs that
// step yet, which is a correct state and not a dead token.
function zeroUse() {
  const source = sourceFiles(['.tsx', '.css'], { without: ['packages/tokens'] })
    .map((file) => readFileSync(file, 'utf8'))
    .join('\n')
  // The gallery prints every token name as label text, so the search has to ignore the
  // names themselves and look only at what a class name would look like. Without this the
  // check reports every token as used and can never fail, which is the disease it treats.
  const names = colourNames()
  const withoutLabels = source.replace(/--color-[a-z-]+/g, '')
  const unused = names.filter((name) => {
    const suffix = name.slice('--color-'.length)
    return !source.includes(`var(${name})`) && !new RegExp(`[a-z]-${suffix}(?![\\w-])`).test(withoutLabels)
  })
  return {
    rule: 'a semantic token with no live use fails',
    counted: `${names.length} semantic colour names`,
    failures: unused.map((name) => `${name} is used nowhere`),
  }
}

// Every hand-authored density utility has to point at a token that exists. A utility whose
// var() name is misspelled produces a rule the browser drops without a word, and the control
// comes out the wrong size on a screen nobody has opened yet.
function utilitiesPointAtTokens() {
  const { utilities, missing } = authoredUtilities()
  return {
    rule: 'every hand-authored utility points at a token that exists',
    counted: `${utilities.length} utilities`,
    failures: missing.map(({ utility, token }) => `${utility} reads ${token}, which is declared nowhere`),
  }
}

// shadcn's vocabulary lives in one file and in the components copied in beside it. Anywhere
// else it is a name nobody on this team can read, pointing at a system we intend to be able
// to delete in one move.
function shadcnStaysInTheBridge() {
  const { checked, offences } = shadcnNamesOutsideTheBridge()
  return {
    rule: `no shadcn colour name outside ${BRIDGE_CSS} and the components copied in beside it`,
    counted: `${checked} files`,
    failures: offences.map(({ file, line, name }) => `${file}:${line} — ${name} is shadcn's name, not ours`),
  }
}

const CHECKS = [
  familyGrammar,
  utilityClasses,
  utilitiesPointAtTokens,
  shadcnStaysInTheBridge,
  ...rawValueChecks,
  utilitiesAreKnownToTheMerger,
  everyScaleStopIsTypeable,
  dtcgMirror,
]
if (process.env['TOKEN_ZERO_USE'] === 'on') CHECKS.push(zeroUse)

let failed = false
console.log(`tokens: ${CHECKS.length} checks`)

for (const check of CHECKS) {
  const { rule, counted, failures } = check()
  const ran = Number.parseInt(counted, 10)

  if (!Number.isFinite(ran) || ran === 0) {
    console.error(`  RAN NOTHING  ${rule} — looked at ${counted}`)
    failed = true
    continue
  }

  if (failures.length > 0) {
    console.error(`  FAIL  ${rule}  (${counted})`)
    for (const failure of failures) console.error(`        ${failure}`)
    failed = true
    continue
  }

  console.log(`  ok    ${rule}  (${counted})`)
}

if (failed) {
  console.error('tokens: FAILED')
  process.exit(1)
}
console.log(`tokens: ${CHECKS.length} checks passed`)
