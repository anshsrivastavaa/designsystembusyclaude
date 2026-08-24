// The token gallery. This is how a token gets reviewed: Aj looks at the swatch, the job it
// does, the names that point at it, and the ink read as real words. Changing a value is one
// line in packages/tokens/palette.css and nothing else moves.
//
// This is the ONE file allowed to name a palette step. Everywhere else a palette name is
// unreachable on purpose — there is no class for one. Here the palette is the subject, so
// it is named through inline var() references, which hold no raw value of their own.

import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { contrastRatio } from '../tokens/contrast'

type Swatch = { token: string; job: string; names: string[] }

const NEUTRALS: Swatch[] = [
  { token: '--neutral-1', job: 'page — the window everything sits on', names: ['--color-surface-page'] },
  { token: '--neutral-2', job: 'surface — cards, the table body', names: ['--color-surface'] },
  { token: '--neutral-3', job: 'surface hovered — under the pointer', names: ['--color-surface-hover'] },
  { token: '--neutral-4', job: 'surface pressed — while being pressed', names: [] },
  { token: '--neutral-5', job: 'sunken — input wells, table headers', names: ['--color-surface-sunken'] },
  { token: '--neutral-6', job: 'raised — popovers, menus, dialogs', names: ['--color-surface-raised'] },
  { token: '--neutral-7', job: 'stroke — the line that divides most things', names: ['--color-stroke'] },
  { token: '--neutral-8', job: 'stroke strong — a line that has to be seen', names: ['--color-stroke-strong'] },
  { token: '--neutral-9', job: 'ink muted — placeholders, empty states', names: ['--color-ink-muted'] },
  { token: '--neutral-10', job: 'ink secondary — labels, calculated values', names: ['--color-ink-secondary'] },
  { token: '--neutral-11', job: 'ink — what you read', names: ['--color-ink'] },
  { token: '--neutral-12', job: 'ink strongest — the end of the ink band', names: [] },
]

const COLOURS: Swatch[] = [
  { token: '--brand-soft', job: 'the softest brand tint', names: ['--color-surface-selected', '--color-info-soft'] },
  { token: '--brand-ring', job: 'the Busy blue from the logo', names: ['--color-stroke-focus'] },
  { token: '--brand', job: 'brand fills and links', names: ['--color-accent', '--color-ink-accent', '--color-info'] },
  { token: '--green-soft', job: 'the tint behind a completed notice', names: ['--color-success-soft'] },
  { token: '--green', job: 'this action completed — never profit', names: ['--color-success'] },
  { token: '--amber-soft', job: 'the tint behind a warning', names: ['--color-warning-soft'] },
  { token: '--amber', job: 'a warning, as words — brown as a fill', names: ['--color-warning'] },
  { token: '--red-soft', job: 'the tint behind an error', names: ['--color-danger-soft'] },
  { token: '--red', job: 'an error, as words — maroon as a fill', names: ['--color-danger'] },
  { token: '--white', job: 'what sits on a filled colour, in every theme', names: ['--color-on-accent'] },
]

// The surfaces ink is allowed to sit on. Ratios are measured against every one of them.
const SURFACES = [
  { token: '--neutral-1', label: 'page' },
  { token: '--neutral-2', label: 'surface' },
  { token: '--neutral-3', label: 'hover' },
  { token: '--neutral-4', label: 'pressed' },
  { token: '--neutral-5', label: 'sunken' },
  { token: '--brand-soft', label: 'selected' },
]

const INK_BAND = ['--neutral-9', '--neutral-10', '--neutral-11', '--neutral-12']

const SPECIMEN = [
  { text: 'Steel rod 12mm', name: '--color-ink' },
  { text: 'Qty · Rate · Amount', name: '--color-ink-secondary' },
  { text: 'Search items…', name: '--color-ink-muted' },
]

// Read once, on mount, from the live stylesheet. The list is module-level and therefore
// stable: a list rebuilt on every render would re-run this effect for ever.
const EVERY_TOKEN = [...NEUTRALS, ...COLOURS].map((swatch) => swatch.token)

function useAuthoredValues() {
  const [values, setValues] = useState<Record<string, string>>({})
  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const read: Record<string, string> = {}
    for (const token of EVERY_TOKEN) read[token] = style.getPropertyValue(token).trim()
    setValues(read)
  }, [])
  return values
}

function Ratios({ ink, values }: { ink: string; values: Record<string, string> }) {
  const inkValue = values[ink]
  if (!inkValue) return null
  return (
    <span className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
      {SURFACES.map(({ token, label }) => {
        const ratio = contrastRatio(inkValue, values[token] ?? '')
        if (ratio === null) return null
        const passes = ratio >= 4.5
        return (
          <span key={token} className="font-mono text-sm text-ink-secondary">
            {label} {ratio.toFixed(2)}
            <span aria-hidden="true">{passes ? ' ✓' : ' ✗'}</span>
            <span className="sr-only">{passes ? 'passes 4.5 to 1' : 'below 4.5 to 1'}</span>
          </span>
        )
      })}
    </span>
  )
}

function Row({ swatch, values }: { swatch: Swatch; values: Record<string, string> }) {
  return (
    <li className="flex items-start gap-4 border-b border-stroke py-3 last:border-b-0">
      <span
        aria-hidden="true"
        className="mt-1 h-12 w-20 shrink-0 rounded-control border border-stroke"
        style={{ background: `var(${swatch.token})` }}
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-3">
          <code className="font-mono text-sm text-ink">{swatch.token}</code>
          <code className="font-mono text-sm text-ink-muted">{values[swatch.token] || '—'}</code>
        </span>
        <span className="mt-1 block text-sm text-ink-secondary">{swatch.job}</span>
        <span className="mt-2 flex flex-wrap gap-2">
          {swatch.names.length === 0 ? (
            <em className="text-sm text-ink-muted">no semantic name needs this step yet</em>
          ) : (
            swatch.names.map((name) => (
              <code key={name} className="rounded-control bg-surface-sunken px-2 py-1 font-mono text-sm text-ink-secondary">
                {name}
              </code>
            ))
          )}
        </span>
        {INK_BAND.includes(swatch.token) ? <Ratios ink={swatch.token} values={values} /> : null}
      </span>
    </li>
  )
}

type SectionProps = { title: string; lead: string; swatches: Swatch[]; values: Record<string, string> }

function Section({ title, lead, swatches, values }: SectionProps) {
  return (
    <section className="mt-10">
      <h2 className="text-lg font-strong text-ink">{title}</h2>
      <p className="mt-1 max-w-2xl text-sm text-ink-secondary">{lead}</p>
      <ul className="mt-4 rounded-card border border-stroke bg-surface px-4">
        {swatches.map((swatch) => (
          <Row key={swatch.token} swatch={swatch} values={values} />
        ))}
      </ul>
    </section>
  )
}

function Panel({ surface, label }: { surface: string; label: string }) {
  return (
    <div className="flex-1 rounded-card border border-stroke p-4" style={{ background: `var(${surface})` }}>
      <p className="font-mono text-sm text-ink-muted">{label}</p>
      {SPECIMEN.map(({ text, name }) => (
        <p key={name} className="mt-3" style={{ fontSize: 'var(--font-size-body)', color: `var(${name})` }}>
          {text}
          <span className="ml-2 font-mono text-sm text-ink-muted">{name}</span>
        </p>
      ))}
    </div>
  )
}

function Densities({ density, label }: { density: string; label: string }) {
  return (
    <div data-density={density} className="mt-4">
      <p className="text-sm font-label text-ink">{label}</p>
      <div className="mt-2 flex gap-4">
        <Panel surface="--color-surface" label="on surface" />
        <Panel surface="--color-surface-sunken" label="on sunken" />
      </div>
    </div>
  )
}

function TokenGallery() {
  const values = useAuthoredValues()

  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Tokens</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          Every colour in the product comes from one of these. The left column is the raw
          value, the grey chips are the names a screen is allowed to type. A screen can
          never type the raw value — there is no class for it.
        </p>

        <section className="mt-10">
          <h2 className="text-lg font-strong text-ink">The three inks, as words</h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-secondary">
            The pair that matters is sunken, because the grid's column headers are secondary
            text on a sunken header band. White is the easy case.
          </p>
          <Densities density="standard" label="Standard" />
          <Densities density="comfortable" label="Comfortable" />
        </section>

        <Section
          title="The neutral scale"
          lead="Twelve steps in three bands, numbered by the job they do. Steps 1 to 6 are surfaces — six roles with no ranking between them, because only surface, its hover and its pressed ever step. Steps 7 and 8 are lines, getting stronger. Steps 9 to 12 are ink, getting darker, in order. The same rule holds in every theme."
          swatches={NEUTRALS}
          values={values}
        />

        <Section
          title="The coloured ramps"
          lead="Only the stops a name actually uses are authored. --amber and --red are text stops, tuned to be read as words on a surface; as fills they read brown and maroon. A warning triangle or a delete button needs a brighter stop, and that is a new token rather than these lightened."
          swatches={COLOURS}
          values={values}
        />
      </div>
    </main>
  )
}

const meta = {
  title: 'Tokens',
  render: () => <TokenGallery />,
} satisfies Meta

export default meta

export const Tokens: StoryObj<typeof meta> = {}
