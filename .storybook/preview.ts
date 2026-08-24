import type { Preview } from '@storybook/react-vite'

// The app's own stylesheet, so a story is styled by exactly what the app is styled by.
import '../apps/magic/src/index.css'

// There is no theme switch here on purpose. One was added with the light and dark work, and
// it kept claiming to change the theme after the pages moved onto tokens and the last dark
// value left the repository — a control that reports a state it is not in is worse than no
// control. It comes back with the dark palette, which is step 5. The `dark` class variant it
// drove is still defined in the stylesheet and still unused.

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
  },
}

export default preview
