// The type page. Every size at every weight, at both densities, set in the words the product
// actually uses.
//
// NO PANGRAM. Aj judges type by reading it, and "the quick brown fox" is not a thing anybody
// reads on this screen. A column heading, an item name, an amount and a grand total are, so
// those are what is set — the same reason the token gallery shows the inks as words rather
// than as swatches. A specimen made of the wrong words answers a question nobody asked.

import type { Meta, StoryObj } from '@storybook/react-vite'

const meta = { title: 'Type' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const SIZES = [
  { klass: 'text-sm', name: 'sm', job: 'column headings, the item strip, small labels' },
  { klass: 'text-body', name: 'body', job: 'cell values and body text — the size of the product' },
  { klass: 'text-lg', name: 'lg', job: 'the party field' },
  { klass: 'text-heading', name: 'heading', job: 'a section or card heading' },
  { klass: 'text-title', name: 'title', job: 'the screen title, one per screen' },
] as const

const WEIGHTS = [
  { klass: 'font-body', name: 'body', number: 400 },
  { klass: 'font-label', name: 'label', number: 510 },
  { klass: 'font-strong', name: 'strong', number: 590 },
  { klass: 'font-total', name: 'total', number: 680 },
] as const

/** Real product text, and each phrase is one the size below it genuinely carries. */
const WORDS = ['S.No.', 'Steel rod 16mm', '1,003.40', '₹1,42,956.50'] as const

function Ladder({ density }: { density: 'standard' | 'comfortable' }) {
  return (
    <section data-density={density} className="rounded-card border border-stroke bg-surface p-6">
      <h2 className="text-heading font-strong text-ink">
        {density === 'standard' ? 'Standard' : 'Comfortable'}
      </h2>
      <p className="mt-1 text-sm text-ink-secondary">
        {density === 'standard'
          ? 'The default. Five sizes, 13 / 14 / 16 / 18 / 22.'
          : 'One notch up, 15 / 16 / 18 / 22 / 26 — and body leading and body weight both open up with it, because Devanagari stacks its marks above and below the line.'}
      </p>

      <div className="mt-6 space-y-8">
        {SIZES.map((size) => (
          <div key={size.name}>
            <p className="text-sm font-label text-ink-muted">
              text-{size.name} — {size.job}
            </p>
            <div className="mt-2 space-y-1 border-t border-stroke pt-2">
              {WEIGHTS.map((weight, at) => (
                <div key={weight.name} className="flex items-baseline gap-6">
                  <span className={`${size.klass} ${weight.klass} min-w-64 text-ink`}>{WORDS[at]}</span>
                  <span className="text-sm text-ink-muted">
                    font-{weight.name} · {weight.number}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export const Ladders: Story = {
  render: () => (
    <div className="space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">Type</h1>
        <p className="mt-1 max-w-2xl text-body leading-body text-ink-secondary">
          Five sizes and four weights. The smallest step is one pixel — 13 against a 14 body —
          which is deliberate: at that distance the SIZE no longer carries hierarchy, the WEIGHT
          does. A column heading at 13/510 beside a value at 14/400 reads as quieter rather than
          smaller, which is what a heading over a column of figures should be. Nobody should
          widen the gap to fix it.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ladder density="standard" />
        <Ladder density="comfortable" />
      </div>
    </div>
  ),
}

/** The one comparison the ladder above cannot make: the four weights at ONE size, close
 * enough together to see the steps between them. */
export const TheWeightsAlone: Story = {
  render: () => (
    <div className="max-w-xl space-y-4 bg-surface-page p-6">
      <h1 className="text-title font-strong tracking-tight text-ink">The four weights</h1>
      <p className="text-body leading-body text-ink-secondary">
        All at text-body, so the only thing changing is the weight. 510 rather than 500 is the
        point of the label step: at the smallest size, 500 is not reliably told apart from 400 on
        Windows, and 600 tips into bold beside it.
      </p>
      <div className="space-y-2 rounded-card border border-stroke bg-surface p-6">
        {WEIGHTS.map((weight) => (
          <p key={weight.name} className={`text-body ${weight.klass} text-ink`}>
            Steel rod 16mm — {weight.number}
          </p>
        ))}
      </div>
    </div>
  ),
}
