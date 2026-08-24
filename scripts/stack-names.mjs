// Which written name means which installed package.
//
// One table, read by every check that has to know whether a written name refers to a package
// that is actually installed. Two copies of this map is how two checks would come to disagree
// about what "Tauri" means.

import { existsSync, readFileSync } from 'node:fs'

export const NAMED = {
  'TanStack Table': '@tanstack/react-table',
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
