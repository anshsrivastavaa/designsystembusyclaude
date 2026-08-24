// Which way dependencies are allowed to point.
//
// Two rules were doing this job and two more were assumed. An assumption is not a rule: the
// library could have imported an application screen, `lib/` could have imported a store, and
// nothing anywhere would have said a word — while `architecture.md` claimed both were true and
// mutation testing was scoped to `lib/` on the strength of one of them.
module.exports = {
  forbidden: [
    {
      name: 'no-feature-to-feature',
      severity: 'error',
      comment:
        'A feature imported another feature. Move the shared thing to packages/ui or to lib.',
      from: { path: 'apps/magic/src/features/([^/]+)/' },
      to: { path: 'apps/magic/src/features/([^/]+)/', pathNot: 'apps/magic/src/features/$1/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'These modules depend on each other in a circle, so neither can be read on its own.',
      from: {},
      to: { circular: true },
    },
    {
      // THE INVERSION THAT KILLS A DESIGN SYSTEM. A library that reaches back into the
      // application it serves cannot be extracted, cannot be shared with the mobile build, and
      // cannot be reasoned about on its own — and it happens one import at a time, each of them
      // reasonable in the moment. architecture.md says packages/ui is ready for the split to
      // its own repository; this is the only thing that can make that true.
      name: 'the-library-never-reaches-into-the-app',
      severity: 'error',
      comment:
        'packages/ui imported from apps/. The library may not know the application exists — that is the whole of what makes it a library. Move what it needs in as a prop, or move the thing itself into packages/ui.',
      from: { path: '^packages/' },
      to: { path: '^apps/' },
    },
    {
      // architecture.md calls lib/ pure, and mutation testing is scoped to lib/ ON THAT BASIS.
      // A store or an adapter reaching in there would make the mutation score a statement about
      // something other than pure logic, quietly.
      name: 'lib-stays-pure',
      severity: 'error',
      comment:
        'lib/ imported a store, a screen or the data layer. It is pure functions — that is why mutation testing is scoped to it, and why anything in it can be trusted without a browser.',
      from: { path: '^apps/magic/src/lib/' },
      to: { path: '(apps/magic/src/features/|apps/magic/src/app/|apps/magic/src/data/(?!schema/))' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(node_modules|dist|storybook-static|reference-old-build)' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
  },
}
