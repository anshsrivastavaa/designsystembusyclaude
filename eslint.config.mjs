import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/storybook-static/**', 'packages/tokens/reference-old-build/**'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mjs'],
    rules: {
      // The previous build ended with 158 names defined more than once, because changing
      // behaviour was done by declaring the same thing again somewhere later instead of
      // editing the original. These two are that failure, as errors.
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',

      // Over 250 lines means the file is two things.
      'max-lines': ['error', { max: 250, skipBlankLines: false, skipComments: false }],

    },
  },
  {
    // Class strings live in components, and not only in a className attribute — shadcn's
    // components declare theirs inside a cva() call. So this looks at every string here,
    // which is also why it is scoped to components: the rule's own pattern is a string too,
    // and a rule that fails its own configuration file is not a rule.
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Tailwind arbitrary values put a raw colour or a raw size back into a component,
      // through a door the raw-value scanner cannot see because the value is inside a class
      // name. w-[137px] and text-[#5b21b6] are the two shapes it takes.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/-\\[[^\\]]+\\]/]',
          message:
            'Tailwind arbitrary value. The size or colour belongs in packages/tokens, and the class name should be a token name.',
        },
        {
          // Tailwind also accepts h-(--row-h) as shorthand for h-[var(--row-h)]. The rule
          // only matched square brackets, so the round form walked straight past it. Both
          // shapes put a raw token reference where a named utility belongs.
          selector: 'Literal[value=/-\\(--[a-z0-9-]+\\)/]',
          message:
            'Tailwind arbitrary value in its round-bracket form. Author a utility in packages/tokens/utilities.css and type its name instead.',
        },
      ],
    },
  },
  {
    // A refusal says "no, and here is why". WE decide whether something is well-formed — is
    // it a number, is it filled in, does the arithmetic add up. THEY decide whether it is
    // allowed — does this GSTIN exist, is the party over its credit limit, is there stock. A
    // component inventing a refusal is a business rule the dev team has to find and delete
    // later, so only the schema layer and the adapter may make one. TypeScript carries most
    // of this through a brand nothing else can name; this carries the rest.
    files: ['apps/magic/src/**/*.ts', 'apps/magic/src/**/*.tsx', 'packages/**/*.ts', 'packages/**/*.tsx'],
    // `data/checked.ts` joins them on 21-08. It sits ON the seam — it is the thing that reads
    // what a backend sent and decides whether it is the shape we asked for. That is a
    // well-formedness question, which is ours, and not an allowed-ness question, which is
    // theirs; the rule's own words draw exactly that line.
    ignores: [
      'apps/magic/src/data/schema/**',
      'apps/magic/src/data/adapter.ts',
      'apps/magic/src/data/checked.ts',
      'apps/magic/src/data/mock/**',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/schema/refusal', '**/data/schema/refusal'],
              importNames: ['refuse'],
              message:
                'Only the schema layer and the adapter may make a refusal. A screen may show one. Whether something is ALLOWED is the backend\'s decision, not ours.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // Seven fields were meant to hide. Every test asked whether the hiding class was on
      // the element and every test passed, while nothing was ever hidden — a competing rule
      // won on specificity. A class name is a proxy for what you mean, not the thing. Ask
      // the browser instead: computed style, visibility, position, accessible name.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'MemberExpression[property.name="toHaveClass"]',
          message:
            'Do not assert on a class name. Assert computed style, visibility, position or accessible name — what the user would actually experience.',
        },
        {
          selector: 'MemberExpression[property.name=/^(className|classList)$/]',
          message:
            'Do not assert on a class name. Assert computed style, visibility, position or accessible name — what the user would actually experience.',
        },
      ],
    },
  },
)
