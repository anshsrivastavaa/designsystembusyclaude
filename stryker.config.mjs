// Mutation testing: break the code on purpose and ask whether any test noticed.
//
// It exists because two of the previous build's measuring tools reported success while
// measuring nothing, and both read as rigour. A passing suite is not evidence the suite can
// fail; this is the only check that asks that question directly.
//
// Scoped to lib/ — pure functions, no React — so it stays fast enough that anyone runs it.
//
// Not part of npm run check, because it re-runs the suite once per mutant and is measured in
// minutes rather than seconds. Run it with npm run mutate when lib/ changes.
export default {
  packageManager: 'npm',
  testRunner: 'vitest',
  vitest: { configFile: 'vitest.config.ts', dir: 'apps/magic/src/lib' },
  mutate: ['apps/magic/src/lib/**/*.ts', '!apps/magic/src/lib/**/*.test.ts'],
  reporters: ['clear-text', 'progress'],
  coverageAnalysis: 'perTest',
}
