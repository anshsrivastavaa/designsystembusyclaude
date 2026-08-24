// Two rules that only exist once shadcn is in the building.

import { readFileSync } from 'node:fs'

import { declarations, TOKEN_CSS } from './token-dtcg.mjs'
import { sourceFiles } from './source-files.mjs'

export const BRIDGE_CSS = 'packages/ui/shadcn-bridge.css'
const UTILITIES_CSS = 'packages/tokens/utilities.css'

// The components copied in from shadcn. They are allowed to type shadcn's names, because
// that is what they arrived speaking. Adding a component to this list is a deliberate act.
const COPIED_FROM_SHADCN = ['packages/ui/Button.tsx']

// The list of token files lives in token-dtcg.mjs and is imported, not copied. It was copied,
// and adding motion.css to one of them left the other behind: every motion utility reported
// its token "declared nowhere" while the token sat in a file this list had never heard of.
// A second definition of the same idea is the defect, not the fix.

export function authoredUtilities() {
  const css = readFileSync(UTILITIES_CSS, 'utf8')
  const declared = new Set(TOKEN_CSS.flatMap((path) => declarations(path).map(({ name }) => name)))

  const utilities = []
  const missing = []

  for (const [, utility, body] of css.matchAll(/@utility\s+([a-z0-9-]+)\s*\{([^}]*)\}/gi)) {
    utilities.push(utility)
    for (const [, token] of (body ?? '').matchAll(/var\((--[a-z0-9-]+)\)/gi)) {
      if (!declared.has(token)) missing.push({ utility, token })
    }
  }

  return { utilities, missing }
}

export function shadcnNamesOutsideTheBridge() {
  const bridged = declarations(BRIDGE_CSS)
    .map(({ name }) => name.replace(/^--color-/, ''))
    .filter(Boolean)

  const files = sourceFiles(['.ts', '.tsx', '.css'], { without: [BRIDGE_CSS, ...COPIED_FROM_SHADCN] })
  const offences = []

  for (const file of files) {
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, index) => {
        const code = line.replace(/\/\/.*$/, '').replace(/\/\*.*$/, '')
        for (const name of bridged) {
          if (new RegExp(`(?<![\\w-])(bg|text|border|ring|ring-offset|fill|stroke|outline)-${name}(?![\\w-])`).test(code)) {
            offences.push({ file, line: index + 1, name })
          }
        }
      })
  }

  return { checked: files.length, offences }
}
