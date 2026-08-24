import type { StorybookConfig } from '@storybook/react-vite'
import tailwindcss from '@tailwindcss/vite'

const config: StorybookConfig = {
  // A GLOB HERE IS RESOLVED AGAINST THIS FOLDER, NOT AGAINST THE PACKAGE NAME. This said
  // '@busy/ui/**/*.stories.tsx', which sent Storybook looking for a folder called `@busy`
  // inside `.storybook`. There is none, so it matched nothing — and Storybook shows a
  // catalogue of whatever it found without ever saying what it did not. Every one of the
  // eighteen library stories existed on disk, and Storybook showed one page, for as long as
  // the library has been a package.
  //
  // The apps/magic line matches nothing either, and that one is CORRECT: no feature keeps a
  // story of its own yet. It is kept so the first one that does is picked up without anybody
  // having to remember this file — and a pattern that has never matched is now told apart
  // from a broken one by the gate, which counts what Storybook actually shows.
  stories: [
    './*.stories.tsx',
    '../packages/ui/**/*.stories.tsx',
    '../apps/magic/src/**/*.stories.tsx',
  ],
  // No addons. The themes addon was removed with the theme switch and comes back at the
  // dark theme step; its package is still installed for that day.
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  // Storybook runs from the repository root, which has no Vite config of its own, so the
  // Tailwind plugin is added here. It is the same plugin the app uses, so a story and the
  // running app get identical styles.
  viteFinal: (viteConfig) => ({
    ...viteConfig,
    plugins: [...(viteConfig.plugins ?? []), tailwindcss()],
    // React and React DOM ship as CommonJS, so Vite has to convert them before a browser
    // can import them. Vite decides what to convert by reading the story files, and the
    // only code importing React by name is inside Storybook's own packages, which Vite
    // does not read. So neither was converted and the preview died on load. Naming them
    // here is what tells Vite to convert them. Storybook 10.5, Vite 7.
    optimizeDeps: {
      ...viteConfig.optimizeDeps,
      include: [...(viteConfig.optimizeDeps?.include ?? []), 'react', 'react-dom'],
    },
  }),
}

export default config
