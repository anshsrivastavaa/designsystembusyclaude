// Every icon in the product, at the size they are actually drawn at.
//
// A grid of names rather than a wall of glyphs: the question this page answers is "is there
// one for that", and you look that up by the word, not by the picture.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { Icon, type IconName } from './Icon'

const meta = { title: 'Icon' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const NAMES: IconName[] = [
  'menu', 'search', 'calendar', 'filter', 'rows', 'plus',
  'chevronDown', 'chevronLeft', 'chevronRight', 'close', 'star', 'bell',
  'printer', 'download', 'share', 'rupee', 'copy', 'trash',
  'more', 'lock', 'help', 'moon', 'sparkle', 'dashboard',
  'invoice', 'purchase', 'item', 'party', 'report', 'invalid',
]

export const Icons: Story = {
  render: () => (
    <div className="space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">Icon</h1>
        <p className="mt-1 max-w-2xl text-body leading-body text-ink-secondary">
          Phosphor, at one weight — regular, chosen to sit with body text at 400 and the labels
          beside it at 510. Our names on the left, so a screen never has to know what Phosphor
          calls a receipt. A new icon is a line in the table, never an SVG in a screen.
        </p>
      </div>

      <ul className="grid grid-cols-5 gap-px rounded-card border border-stroke bg-stroke">
        {NAMES.map((name) => (
          <li key={name} className="flex items-center gap-2 bg-surface px-3 py-3">
            <Icon name={name} className="text-ink" />
            <span className="truncate text-sm text-ink-secondary">{name}</span>
          </li>
        ))}
      </ul>

      <div className="rounded-card border border-stroke bg-surface p-6">
        <h2 className="text-heading font-strong text-ink">The sizes, from the token layer</h2>
        <div className="mt-3 flex items-end gap-6">
          {(['size-icon-xs', 'size-icon-sm', 'size-icon-md', 'size-icon-lg', 'size-icon-xl'] as const).map((size) => (
            <span key={size} className="flex flex-col items-center gap-2">
              <Icon name="invoice" className={`${size} text-ink`} />
              <span className="text-sm text-ink-muted">{size.replace('size-icon-', '')}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  ),
}

// FILLED IS A STATE, NOT A SECOND WEIGHT. The outline is off and the fill is on, which is how
// every product draws a favourite and how a person already reads one. Shown as a pair, because
// a filled icon on its own says nothing — it is the DIFFERENCE that carries the meaning.
export const OnAndOff: Story = {
  render: () => (
    <div className="bg-surface p-8">
      <div className="flex items-center gap-8">
        {(['star', 'bell', 'tick'] as const).map((name) => (
          <div key={name} className="flex items-center gap-3">
            <span className="flex flex-col items-center gap-1">
              <Icon name={name} className="size-icon-xl text-ink-secondary" />
              <span className="text-sm text-ink-muted">off</span>
            </span>
            <span className="flex flex-col items-center gap-1">
              <Icon name={name} filled className="size-icon-xl text-ink-accent" />
              <span className="text-sm text-ink-muted">on</span>
            </span>
          </div>
        ))}
      </div>

      {/* The density pair is solid already and has no outline form, so `filled` draws the same
          thing. Shown here so nobody reaches for it expecting a second state. */}
      <div className="mt-8 flex items-center gap-3">
        <Icon name="densityStandard" className="size-icon-xl text-ink-secondary" />
        <Icon name="densityStandard" filled className="size-icon-xl text-ink-secondary" />
        <span className="text-sm text-ink-muted">filled means nothing to these two</span>
      </div>
    </div>
  ),
}
