// EVERY WORKSPACE DECLARES WHAT IT IMPORTS.
//
// THE FAULT THIS EXISTS FOR, IN ONE LINE FROM A DEPLOY LOG:
//
//   [vite]: Rollup failed to resolve import "zustand" from "apps/magic/src/app/settingsStore.ts"
//
// Every runtime dependency in this build sat in the ROOT package.json. `apps/magic` imported
// zod, zustand and @busy/ui while declaring react and react-dom; `packages/ui` imported five
// packages and declared none at all. Nothing here ever noticed, because npm hoists a workspace
// tree into one node_modules at the top and Node walks up until it finds a thing. Every import
// resolved. Every check was green. Twelve deploys in a row failed.
//
// IT ONLY BREAKS WHERE NOBODY IS WATCHING, which is what makes it worth a gate rather than a
// note. It breaks when one workspace is installed or built on its own — which is exactly what a
// deploy does, and what the dev team's first three commands do: clone, install, build.
//
// THE SPLIT BETWEEN A WORKSPACE AND THE ROOT. A root holds tooling — the test runners, the
// browser driver, the linter, the story builder — because tooling is run from the root against
// everything. A workspace holds what its own code imports, because that is what has to be there
// when only that workspace is installed. So a test file or a story may reach the root's tooling;
// a file that gets built may not reach anything it has not declared.

import { readFileSync, existsSync } from 'node:fs'
import { builtinModules } from 'node:module'

import { sourceFiles } from './source-files.mjs'

const BUILTIN = new Set(builtinModules)

const manifest = (path) => JSON.parse(readFileSync(path, 'utf8'))
const declaredIn = (json) =>
  new Set([
    ...Object.keys(json.dependencies ?? {}),
    ...Object.keys(json.devDependencies ?? {}),
    ...Object.keys(json.peerDependencies ?? {}),
  ])

const root = manifest('package.json')
const rootDeclares = declaredIn(root)

// The workspaces, read off the root rather than listed here, so a new one is covered the day it
// is added rather than the day somebody remembers this file.
const workspaces = []
for (const pattern of root.workspaces ?? []) {
  const [folder] = pattern.split('/*')
  for (const name of sourceFiles(['package.json'], { from: folder }).map((p) => p.replace('/package.json', ''))) {
    if (existsSync(`${name}/package.json`)) workspaces.push(name)
  }
}

/** Run from the root by tooling the root owns, rather than built as part of a workspace. */
const toolingRuns = (file) =>
  /\.(test|stories)\.tsx?$/.test(file) || file.startsWith('.storybook/') || file.includes('/flow/')

/** `@scope/name/deep/path` → `@scope/name`, `name/deep/path` → `name`. */
const packageOf = (specifier) =>
  specifier.startsWith('@') ? specifier.split('/').slice(0, 2).join('/') : specifier.split('/')[0]

// THREE FORMS, AND THE FIRST ONE SPANS LINES. An earlier version of this pattern refused to
// cross a newline, so `Icon.tsx`'s import of forty icon names over forty lines was invisible and
// @phosphor-icons/react went unreported — the gate would have shipped claiming to be complete
// while missing the largest dependency in the library. Found by reading the list it printed and
// asking what was NOT on it.
const IMPORTS = [
  // The middle is restricted to what can appear between the keyword and `from` — names, braces,
  // a star, commas, `type`, `as`. Letting it be anything at all made a line starting `export
  // const` run forward to the next unrelated `from` and report a fragment of JSX as a package.
  /(?:^|\n)\s*(?:import|export)\s+(?:[\w*{},\s]+?)\s+from\s*['"]([^'"]+)['"]/g,
  /(?:^|\n)\s*import\s+['"]([^'"]+)['"]/g,
  /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
]

function* specifiersIn(text) {
  for (const pattern of IMPORTS) {
    for (const [, specifier] of text.matchAll(pattern)) yield specifier
  }
}

const files = sourceFiles(['.ts', '.tsx', '.mjs'])
let examined = 0
const missing = []

for (const file of files) {
  const owner = workspaces.find((name) => file.startsWith(`${name}/`))
  const json = owner === undefined ? root : manifest(`${owner}/package.json`)
  const allowed = owner === undefined ? rootDeclares : declaredIn(json)

  for (const specifier of specifiersIn(readFileSync(file, 'utf8'))) {
    if (specifier.startsWith('.') || specifier.startsWith('/') || specifier.startsWith('node:')) continue
    const name = packageOf(specifier)
    if (BUILTIN.has(name)) continue
    examined += 1

    if (allowed.has(name)) continue
    // A package may import itself by name. Node resolves it through the package's own `exports`
    // field with nothing installed, so packages/ui's tests reaching for `@busy/ui/Button` are
    // not depending on the hoist that this gate exists to catch.
    if (name === json.name) continue
    if (toolingRuns(file) && rootDeclares.has(name)) continue

    missing.push({ file, name, owner: owner ?? '(the root)' })
  }
}

const RULE = 'every package a workspace imports is declared in that workspace'
console.log('deps: 1 check')

if (examined === 0) {
  console.error(`  RAN NOTHING  ${files.length} files and not one import of a package in any of them`)
  console.error('deps: FAILED')
  process.exit(1)
}

if (missing.length > 0) {
  console.error(`  FAIL  ${RULE}  (${examined} imports, ${workspaces.length} workspaces)`)
  const byOwner = new Map()
  for (const one of missing) {
    if (!byOwner.has(one.owner)) byOwner.set(one.owner, new Map())
    const names = byOwner.get(one.owner)
    if (!names.has(one.name)) names.set(one.name, [])
    names.get(one.name).push(one.file)
  }
  for (const [owner, names] of byOwner) {
    console.error(`        ${owner}/package.json does not declare:`)
    for (const [name, where] of names) {
      console.error(`          ${name}   imported by ${where[0]}${where.length > 1 ? ` and ${where.length - 1} more` : ''}`)
    }
  }
  console.error('        It resolves here because npm hoists everything into one node_modules.')
  console.error('        It will not resolve when that workspace is installed or built on its own.')
  console.error('deps: FAILED')
  process.exit(1)
}

console.log(`  ok    ${RULE}  (${examined} imports, ${workspaces.length} workspaces)`)
console.log('deps: 1 check passed')
