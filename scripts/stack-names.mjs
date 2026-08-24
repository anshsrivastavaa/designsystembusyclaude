// Which written name means which installed package.
//
// One table, read by every check that has to know whether a written name refers to a package
// that is actually installed. Two copies of this map is how two checks would come to disagree
// about what "Tauri" means.

import { existsSync, readFileSync } from 'node:fs'

export const NAMED = {
  'TanStack Table': '@tanstack/react-table',
  'cmdk': 'cmdk',
  'Radix': '@radix-ui/react-slot',
  'Vite': 'vite',
  'Tailwind': 'tailwindcss',
  'Storybook': 'storybook',
  'TypeScript': 'typescript',
  'TanStack Virtual': '@tanstack/react-virtual',
  'TanStack Query': '@tanstack/react-query',
  'react-hook-form': 'react-hook-form',
  'Tauri': '@tauri-apps/api',
  'zod': 'zod',
  'Zustand': 'zustand',
  'Vitest': 'vitest',
  'Playwright': 'playwright',
  'React 19': 'react',
}

// SHADCN/UI IS THE ONE NAME DELIBERATELY ABSENT FROM THIS MAP, and it is absent because it is
// not a package. Its components were copied into `packages/ui` as source we own, so there is
// nothing to be installed or uninstalled and nothing that can quietly stop being true. Every
// other name in either document maps to something npm can be asked about.

/** Whether a written name is excused by a marker directly after it: `Tauri 2 (not installed)`.
 *
 * THE WINDOW IS TIGHT ON PURPOSE — a version number may sit between, and nothing else. A loose
 * test let one disclaimer at the end of a sentence excuse every name in it, and the same bug
 * then appeared a second time in the documents group, where any row containing the words "not
 * installed" excused every package named in that row. Two gates, one mistake, because the test
 * lived twice. It lives here now. */
export function excusedAt(text, at, name) {
  return /^\s*\d*\s*\(not installed\)/i.test(text.slice(at + name.length))
}

/** Every NAMED entry that appears in this text as a WHOLE word, with where it appears.
 *  The boundary matters: without it "Vitest" claims "Vite". */
export function namesIn(text) {
  const found = []
  for (const [named, packageName] of Object.entries(NAMED)) {
    const pattern = new RegExp(`(?<![\\w-])${named.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}(?![\\w-])`, 'g')
    for (const match of text.matchAll(pattern)) {
      found.push({ named, packageName, at: match.index, excused: excusedAt(text, match.index, named) })
    }
  }
  return found
}

export function installedPackages() {
  const have = new Set()
  for (const manifest of ['package.json', 'apps/magic/package.json', 'packages/ui/package.json']) {
    if (!existsSync(manifest)) continue
    const json = JSON.parse(readFileSync(manifest, 'utf8'))
    for (const where of ['dependencies', 'devDependencies']) {
      for (const name of Object.keys(json[where] ?? {})) have.add(name)
    }
  }
  return have
}
