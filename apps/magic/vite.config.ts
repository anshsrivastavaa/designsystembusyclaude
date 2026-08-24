import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `@busy/ui/Button`, not `../../../../../packages/ui/Button`.
//
// WHY THIS IS NOT COSMETIC. The library declared itself a package and nothing treated it as
// one: ninety-two imports climbed four and five directories to reach it, which means the depth
// of a file's folder is baked into every line that uses a component. Move a screen one level
// and every import in it breaks. Worse, `architecture.md` says this is "ready for the split"
// to a design-system repository and mobile is meant to share these foundations — and nothing
// outside this app could have resolved a single one of those paths. A relative climb is not an
// interface; it is an admission that there is no boundary.
//
// The alias is declared in three places because three tools resolve modules and none of them
// reads the others: here for the bundler, in tsconfig for the type checker, and in
// vitest.config for the test runner. Any one of them missing shows up as "cannot find module"
// in exactly one command, which is the confusing kind of broken.
// `.pathname` rather than node:url's fileURLToPath, so this config needs no @types/node —
// adding a whole type package to turn one URL into a path is a dependency for a one-liner.
const ui = new URL('../../packages/ui', import.meta.url).pathname

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [{ find: /^@busy\/ui\/(.*)$/, replacement: `${ui}/$1` }],
  },
})
