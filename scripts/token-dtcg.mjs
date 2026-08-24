// Builds the DTCG JSON from the token CSS, which is the one source.
//
// The CSS is where the values are authored and where the reasoning is written, so it is the
// source and the JSON is generated from it. The gate regenerates and compares: any
// difference means the JSON was hand-edited or somebody changed a value and did not
// regenerate. Run `npm run tokens:write` to bring it back in line.
//
// The React Native theme is the third artefact this will produce. It is not built yet
// because mobile is a separate product and nothing consumes it — it arrives with the first
// consumer, not in anticipation.

import { readFileSync, writeFileSync } from 'node:fs'

export const TOKEN_CSS = [
  'packages/tokens/palette.css',
  'packages/tokens/semantic.css',
  'packages/tokens/scaled.css',
  'packages/tokens/radius.css',
  'packages/tokens/motion.css',
]

const DECLARATION = /(--[a-z][a-z0-9-]*)\s*:\s*([^;]+);/gi

/** Every custom property declared in a file, in source order, comments stripped. */
export function declarations(cssPath) {
  const css = readFileSync(cssPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  const found = []
  for (const match of css.matchAll(DECLARATION)) {
    const [, name, rawValue] = match
    if (name && rawValue) found.push({ name, value: rawValue.trim() })
  }
  return found
}

function typeOf(value) {
  if (/^#[0-9a-f]{3,8}$/i.test(value) || /^rgba?\(/i.test(value)) return 'color'
  if (/^-?[\d.]+px$/.test(value)) return 'dimension'
  // DTCG has real types for both halves of a motion token, and this file is the artefact a
  // design tool imports — a duration arriving as a shadow is not a rounding error, it is the
  // wrong thing entirely, and it lands silently.
  if (/^-?[\d.]+m?s$/.test(value)) return 'duration'
  if (/^cubic-bezier\(/i.test(value)) return 'cubicBezier'
  if (/^var\(--/.test(value)) return 'color'
  return 'shadow'
}

/** var(--neutral-2) becomes the DTCG alias {palette.neutral-2}. */
function alias(value) {
  const reference = value.match(/^var\((--[a-z0-9-]+)\)$/i)
  return reference?.[1] ? `{palette.${reference[1].slice(2)}}` : value
}

function group(cssPath) {
  const entries = {}
  for (const { name, value } of declarations(cssPath)) {
    entries[name.slice(2)] = { $type: typeOf(value), $value: alias(value) }
  }
  return entries
}

export function buildDtcg() {
  const scaled = declarations('packages/tokens/scaled.css')
  const standardCount = scaled.length / 2

  return {
    $description:
      'Generated from the token CSS by scripts/token-dtcg.mjs. Do not hand-edit — the token gate regenerates this and fails on any difference. Run npm run tokens:write.',
    palette: group('packages/tokens/palette.css'),
    semantic: group('packages/tokens/semantic.css'),
    radius: group('packages/tokens/radius.css'),
    motion: group('packages/tokens/motion.css'),
    scaled: {
      standard: Object.fromEntries(
        scaled.slice(0, standardCount).map(({ name, value }) => [name.slice(2), { $type: typeOf(value), $value: value }]),
      ),
      comfortable: Object.fromEntries(
        scaled.slice(standardCount).map(({ name, value }) => [name.slice(2), { $type: typeOf(value), $value: value }]),
      ),
    },
  }
}

export const DTCG_PATH = 'packages/tokens/tokens.dtcg.json'

export function serialise(dtcg) {
  return `${JSON.stringify(dtcg, null, 2)}\n`
}

if (process.argv[1]?.endsWith('token-dtcg.mjs') && process.argv.includes('--write')) {
  writeFileSync(DTCG_PATH, serialise(buildDtcg()))
  console.log(`wrote ${DTCG_PATH}`)
}
