// What a file may be CALLED. Two rules, out of check-shape.mjs because that file crossed 250
// lines and the check was right about what had grown: naming rules and dependency rules are two
// things that happen to run in the same group.
//
// They stay one GROUP because a group is a list that maintains itself — the moment "shape" is
// two commands, one of them gets left off a CI file, which has already happened three times in
// the previous build.

import { basename } from 'node:path'

import { sourceFiles } from './source-files.mjs'

const ALL = ['.ts', '.tsx', '.mjs', '.css', '.json', '.html']
const MODULES = ['.ts', '.tsx', '.mjs', '.js', '.jsx']

// Files are named after the thing, never after the round or the date that produced them.
// The previous build had round12-track-door and round19-bill-reference, and to change
// behaviour a later file redefined what an earlier one had declared. This is scoped to every
// source file rather than to a folder called src, because packages/tokens has no src.
  const named = sourceFiles(ALL, { without: ['package-lock.json'] })
  const withDigits = named.filter((path) => /\d/.test(basename(path)))

function noDigits() {
  if (named.length === 0) {
    return { ok: false, lines: ['  RAN NOTHING  filename rule matched no file'] }
  }
  if (withDigits.length > 0) {
    return {
      ok: false,
      lines: [
        `  FAIL  no digit in any source filename  (${named.length} files)`,
        ...withDigits.map((path) => `        ${path} — name it after the thing, not the round`),
      ],
    }
  }
  return { ok: true, line: `  ok    no digit in any source filename  (${named.length} files)` }
}

// Two files in one folder that one import could mean.
//
// WHAT HAPPENED. `Settings.tsx` imported its list from `settings.ts` beside it. `import
// './settings'` has no extension, so the resolver tries several — and a Mac's filesystem does
// not tell `settings` from `Settings` apart, so it resolved to the file doing the importing.
// The build died with "Settings is not exported by settings.ts": no type error, no lint error,
// and nothing pointing at the real cause. On CI's Linux the two names ARE different, so it
// would have built there and gone on breaking on every Mac in the team. Green on the server,
// red on the machine, and nothing in between to say why — the shape this suite exists for.
//
// IT IS THE MODULE NAME THAT CLASHES, NOT THE FILENAME, which is why this compares basenames
// with the extension taken off. `Table.tsx` and `Table.stories.tsx` are fine — nothing imports
// `./Table.stories` by accident. `cn.ts` and `cn.tsx` are not, and neither is settings/Settings.
//
// It is per FOLDER, because a relative import can only be ambiguous among its neighbours.
//
// NOTE FOR WHOEVER DOUBTS IT: you cannot plant the two-case version of this on a Mac to watch
// it fail. Writing `table.tsx` beside `Table.tsx` OVERWRITES it — which is its own good reason
// for the rule. The same-name-different-extension version is plantable and was: `cn.tsx` beside
// `cn.ts` printed "cn.ts and cn.tsx — one import could mean either; rename one".
function oneImportOneFile() {
  const byModule = new Map()
  for (const path of sourceFiles(MODULES)) {
  const at = path.lastIndexOf('/')
  const folder = at === -1 ? '.' : path.slice(0, at)
  const file = path.slice(at + 1)
  const base = file.slice(0, file.lastIndexOf('.'))
  const key = `${folder}/${base.toLowerCase()}`
  byModule.set(key, [...(byModule.get(key) ?? []), path])
}
const ambiguous = [...byModule.values()].filter((paths) => paths.length > 1)
const modules = [...byModule.values()].reduce((total, paths) => total + paths.length, 0)

  if (modules === 0) {
    return { ok: false, lines: ['  RAN NOTHING  the module-name rule looked at no file'] }
  }
  if (ambiguous.length > 0) {
    return {
      ok: false,
      lines: [
        `  FAIL  no two files in one folder answer to the same import  (${modules} modules)`,
        ...ambiguous.map((paths) => `        ${paths.join(' and ')} — one import could mean either; rename one`),
      ],
    }
  }
  return { ok: true, line: `  ok    no two files in one folder answer to the same import  (${modules} modules)` }
}

export const nameRules = () => [noDigits(), oneImportOneFile()]
