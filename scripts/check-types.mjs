// The types group.
//
// It also answers the hole that was owed: the workspace loop used --if-present, so a
// workspace with no typecheck script was skipped in silence. Counting projects would not
// have caught that — the count stays healthy while a whole package goes unchecked. So this
// asks the harder question instead: is every TypeScript file in the repository actually
// covered by one of the projects that ran? A file nobody type-checks is the failure,
// whichever package it sits in.

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { relative, resolve } from 'node:path'

import { sourceFiles } from './source-files.mjs'

const projects = []

function listFiles(command, args) {
  const output = execFileSync(command, args, { stdio: ['pipe', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 })
  return output
    .toString()
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((path) => relative(process.cwd(), resolve(path)))
    .filter((path) => !path.startsWith('..') && !path.includes('node_modules'))
}

projects.push({ name: 'root', run: () => listFiles('npx', ['tsc', '--noEmit', '--listFiles']) })

const { workspaces = [] } = JSON.parse(readFileSync('package.json', 'utf8'))
const directories = workspaces.flatMap((pattern) => {
  const base = pattern.replace(/\/\*$/, '')
  return execFileSync('ls', [base]).toString().trim().split('\n').map((entry) => `${base}/${entry}`)
})

for (const directory of directories) {
  const manifest = `${directory}/package.json`
  if (!existsSync(manifest)) continue
  const { name, scripts = {} } = JSON.parse(readFileSync(manifest, 'utf8'))
  if (!scripts['typecheck']) continue
  projects.push({
    name,
    run: () => listFiles('npx', ['tsc', '--noEmit', '--listFiles', '-p', directory]),
  })
}

// THE COUNT IS DERIVED. It read `projects.length + 1`, where the 1 was the coverage check —
// a magic number that would have been wrong the moment a second check was added beside it, and
// wrong quietly, because nothing compares the number to what actually ran.
const OUT = []
const RESULTS = []
const result = (text) => {
  RESULTS.push(text)
  OUT.push(text)
}
const detail = (text) => OUT.push(text)

// EVERY EXIT GOES THROUGH HERE. Buffering the lines so the header can carry a true count means
// a bare process.exit() prints nothing at all — which is how a red run would have become a
// silent one. Caught by reading the failure path rather than by running it.
const flush = () => {
  console.log(`types: ${RESULTS.length} checks`)
  for (const text of OUT) (text.startsWith('  ok') ? console.log : console.error)(text)
}
const stop = () => {
  flush()
  console.error('types: FAILED')
  process.exit(1)
}

if (projects.length === 0) {
  console.error('types: RAN NOTHING — no project was type-checked')
  process.exit(1)
}

const covered = new Set()
for (const project of projects) {
  try {
    const files = project.run()
    for (const file of files) covered.add(file)
    result(`  ok    ${project.name} type-checks  (${files.length} files)`)
  } catch {
    result(`  FAIL  ${project.name} type-checks`)
    stop()
  }
}

const everyFile = sourceFiles(['.ts', '.tsx'])
const uncovered = everyFile.filter((file) => !covered.has(file))

if (everyFile.length === 0) {
  result('  RAN NOTHING  no TypeScript file was found to check coverage against')
  stop()
}

if (uncovered.length > 0) {
  result(`  FAIL  every TypeScript file is covered by a project  (${everyFile.length} files)`)
  for (const file of uncovered) detail(`        ${file} — no tsconfig includes it, so nothing type-checks it`)
  stop()
}

result(`  ok    every TypeScript file is covered by a project  (${everyFile.length} files)`)
if (RESULTS.length === 0) {
  result('  RAN NOTHING  this group reported no result at all')
  stop()
}
flush()
console.log(`types: ${RESULTS.length} checks passed`)
