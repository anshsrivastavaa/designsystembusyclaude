// The half of the token layer you cannot see in a swatch: corners, gaps, shadows, icon sizes,
// the heights every control is cut to, and the speeds everything moves at.
//
// EVERY PLATE IS DRAWN TWICE, at both densities, because the scaled layer's whole claim is that
// these move together and a single-density gallery hides exactly that. Radius and elevation do
// NOT move, and are still drawn twice against something beside them that does, so the staying
// still is visible rather than assumed. Motion is the one exception and says why.
//
// No raw value is typed here: where a class exists the class is typed, and where one does not
// the token is named through var(), which holds no value of its own.

import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'

import { Icon } from './Icon'

const DENSITIES = [
  { value: 'standard', label: 'Standard' },
  { value: 'comfortable', label: 'Comfortable' },
]

/** The name a screen is allowed to type for the thing above it. */
function Name({ children }: { children: ReactNode }) {
  return <code className="mt-2 block font-mono text-sm text-ink-muted">{children}</code>
}

type PlateProps = { title: string; on?: 'surface' | 'page'; single?: boolean; children: ReactNode }

function Plate({ title, on = 'surface', single = false, children }: PlateProps) {
  const box = (
    <div className={`rounded-card border border-stroke p-6 ${on === 'page' ? 'bg-surface-page' : 'bg-surface'}`}>
      {children}
    </div>
  )
  return (
    <section className="mt-12">
      <h2 className="text-lg font-strong text-ink">{title}</h2>
      {single ? (
        <div className="mt-4">{box}</div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-6">
          {DENSITIES.map(({ value, label }) => (
            <div key={value} data-density={value}>
              <p className="mb-2 text-sm font-label text-ink-muted">{label}</p>
              {box}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

// The control keeps its corner while its height climbs, which is the ruling drawn not stated.
function Corners() {
  return (
    <div className="flex items-end gap-4">
      <div>
        <div className="h-control-lg w-28 rounded-control border border-stroke-strong bg-surface-sunken" />
        <Name>control</Name>
      </div>
      <div>
        <div className="h-28 w-28 rounded-card border border-stroke-strong bg-surface-sunken" />
        <Name>card</Name>
      </div>
      <div>
        <div className="h-control-lg w-20 rounded-pill border border-stroke-strong bg-surface-sunken" />
        <Name>pill</Name>
      </div>
    </div>
  )
}

// The step scale is the layout ladder and holds still. The two authored spacing tokens are the
// item grid's cell padding and those grow — the pair is the scaled layer's argument in a picture.
const STEPS = ['w-1', 'w-2', 'w-3', 'w-4', 'w-6', 'w-8', 'w-10']

function Gaps() {
  return (
    <div>
      {STEPS.map((step) => (
        <div key={step} className="flex items-center gap-3 py-1">
          <span className={`${step} h-5 bg-accent`} />
          <code className="font-mono text-sm text-ink-muted">{step.replace('w-', '')}</code>
        </div>
      ))}

      {/* Drawn as what they are — the padding inside one cell of the item grid — rather than
          as two bars. As bars they are one short tick beside a shorter one, and the growth that
          is the entire argument for a scaled layer is a few pixels nobody can see. As a cell,
          the cell gets visibly roomier.
          (The raw-value gate caught this comment naming a measurement, which is the gate
          working: a number in prose is exactly how one gets copied into code later.) */}
      <div className="mt-4 border-t border-stroke pt-4">
        <div className="inline-block bg-surface-sunken">
          <div
            className="bg-surface-selected text-body text-ink"
            style={{ margin: 'var(--space-cell-y) var(--space-cell-x)' }}
          >
            Steel rod 12mm
          </div>
        </div>
        <Name>--space-cell-x · --space-cell-y</Name>
      </div>
    </div>
  )
}

// On the page fill, because that is what every one of these actually sits on. On white the two
// lighter ones are nearly invisible and the set reads as three when it is four.
const SHADOWS = ['shadow-raised', 'shadow-popover', 'shadow-dialog', 'shadow-drawer']

function Elevation() {
  return (
    <div className="grid grid-cols-2 gap-6 p-2">
      {SHADOWS.map((shadow) => (
        <div key={shadow}>
          <div className={`h-24 rounded-card bg-surface ${shadow}`} />
          <Name>{shadow}</Name>
        </div>
      ))}
    </div>
  )
}

// One icon, five sizes, on a shared baseline so the steps read as steps.
const ICON_SIZES = ['size-icon-xs', 'size-icon-sm', 'size-icon-md', 'size-icon-lg', 'size-icon-xl']

function Icons() {
  return (
    <div className="flex items-end gap-6">
      {ICON_SIZES.map((size) => (
        <div key={size} className="flex flex-col items-center">
          <Icon name="invoice" className={`${size} text-ink`} />
          <code className="mt-2 font-mono text-sm text-ink-muted">{size.replace('size-icon-', '')}</code>
        </div>
      ))}
    </div>
  )
}

// Side by side on one baseline, because the question is how they compare. Stacked in a column
// with a gap between them — the first drawing — four values that close read as identical bars.
const HEIGHTS = ['h-control-sm', 'h-control', 'h-control-lg', 'h-row']

function Heights() {
  return (
    <div className="flex items-end gap-4">
      {HEIGHTS.map((height) => (
        <div key={height} className="flex flex-col items-center">
          <span className={`${height} w-16 rounded-control border border-stroke-strong bg-surface-sunken`} />
          <code className="mt-2 font-mono text-sm text-ink-muted">{height.replace('h-', '')}</code>
        </div>
      ))}
    </div>
  )
}

// The one plate that cannot be a still picture, and the one drawn ONCE rather than twice. It
// was drawn at both densities like the rest, and each copy got its own button and its own
// state — so pressing one left the other sitting still, which is a control lying about what it
// governs. Motion does not scale with density and, unlike radius and elevation, there is
// nothing beside it that does, so a second copy shows nothing and costs a working control.
//
// Four bars fill at the four speeds, released together, so the differences read as differences
// rather than as four demonstrations you have to hold in your head. Leave runs beside the three
// arrivals on purpose: it finishes first, and seeing that IS the ruling.

const SPEEDS = ['duration-swift', 'duration-glide', 'duration-enter', 'duration-leave']

function Motion() {
  const [run, setRun] = useState(false)

  return (
    <div>
      {SPEEDS.map((speed) => (
        <div key={speed} className="flex items-center gap-3 py-1">
          <span className="w-14 font-mono text-sm text-ink-muted">{speed.replace('duration-', '')}</span>
          <span className="h-5 flex-1 rounded-control bg-surface-sunken">
            <span
              className={`block h-5 rounded-control bg-accent transition-all ease-settle ${speed} ${run ? 'w-full' : 'w-0'}`}
            />
          </span>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setRun((was) => !was)}
        className="mt-3 h-control-sm rounded-control bg-accent px-3 text-body text-on-accent transition-colors duration-swift ease-settle"
      >
        {run ? 'Send them back' : 'Run them'}
      </button>

      <div className="mt-4 border-t border-stroke pt-4">
        <div key={String(run)} className="motion-rise rounded-control bg-surface-selected p-3 text-body text-ink">
          Arriving moves as well as fades
        </div>
        <Name>motion-rise</Name>
      </div>
    </div>
  )
}

function DimensionGallery() {
  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-title font-strong tracking-tight">Dimensions</h1>

        <Plate title="Corners">
          <Corners />
        </Plate>

        <Plate title="Gaps">
          <Gaps />
        </Plate>

        <Plate title="Elevation" on="page">
          <Elevation />
        </Plate>

        <Plate title="Icons">
          <Icons />
        </Plate>

        <Plate title="Heights">
          <Heights />
        </Plate>

        <Plate title="Motion" single>
          <Motion />
        </Plate>
      </div>
    </main>
  )
}

const meta = {
  title: 'Dimensions',
  render: () => <DimensionGallery />,
} satisfies Meta

export default meta

export const Dimensions: StoryObj<typeof meta> = {}
