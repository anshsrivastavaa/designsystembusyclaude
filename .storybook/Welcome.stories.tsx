// Temporary. Deleted when the first real screen arrives.
//
// Every colour on this page now comes from a semantic token — bg-surface, text-ink,
// bg-accent. There is no Tailwind default colour left on it, and no raw value, which is
// what makes it the smallest honest test that the token layer is wired.

import type { Meta, StoryObj } from '@storybook/react-vite'

function WelcomePage() {
  return (
    <main className="min-h-screen bg-surface px-8 py-12 text-ink">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-title font-strong tracking-tight">Welcome</h1>

        <p className="mt-6 leading-body">
          This is the catalogue of every component in Busy Magic, with every state each one
          can be in — resting, hovered, focused, disabled, holding an error, holding too
          much text. A component is not finished until all of its states are here, because
          a state nobody put on this page is a state nobody has looked at.
        </p>
        <p className="mt-4 leading-body">
          It is also how work gets reviewed. Aj opens a story, clicks it, types into it and
          says yes or no. Nothing needs to be running, nothing needs data behind it, and
          nothing needs reading. When the dev team takes this over, the same catalogue is
          the handover document.
        </p>

        <h2 className="mt-12 text-sm font-label uppercase tracking-wide text-ink-muted">
          The tokens are wired
        </h2>

        <div className="mt-4 h-24 rounded-card bg-accent" />
        <p className="mt-2 text-sm text-ink-secondary">
          A block of the accent blue, painted by the name <code>bg-accent</code> and by
          nothing else. Change one line of the palette and this block moves.
        </p>

        <div className="mt-6 rounded-card border border-stroke bg-surface-sunken p-6 text-ink">
          <p className="leading-body">
            A recessed panel — the same surface an input well and a table header sit on,
            with the dividing line above it. The light and dark switch in the toolbar has
            nothing behind it yet: the dark palette is authored once a real screen stands.
            Until then this page is the light theme, and Tokens is where the colours are
            reviewed.
          </p>
        </div>
      </div>
    </main>
  )
}

const meta = {
  title: 'Welcome',
  render: () => <WelcomePage />,
} satisfies Meta

export default meta

export const Welcome: StoryObj<typeof meta> = {}
