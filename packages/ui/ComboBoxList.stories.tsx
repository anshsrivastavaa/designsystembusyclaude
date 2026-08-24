// The panel a ComboBox drops, on its own — so the parts that only appear in particular states
// can be looked at without arranging those states on a screen first.

import { useRef, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { ComboBoxList } from './ComboBoxList'

const meta = { title: 'ComboBoxList' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

type Party = { id: string; name: string; city: string; group: string }

const PARTIES: Party[] = [
  { id: 'p1', name: 'Shah Enterprises', city: 'Ahmedabad', group: 'Recent' },
  { id: 'p2', name: 'Cash', city: '—', group: 'Recent' },
  { id: 'p3', name: 'Sharma Traders', city: 'Indore', group: 'All parties' },
  { id: 'p4', name: 'Sharma Hardware', city: 'Bhopal', group: 'All parties' },
  { id: 'p5', name: 'Gupta Steel Company', city: 'Kanpur', group: 'All parties' },
]

function Panel({ withLead, withSticky }: { withLead: boolean; withSticky: boolean }) {
  const [highlight, setHighlight] = useState(withLead ? 0 : 1)
  const listRef = useRef<HTMLDivElement>(null)

  return (
    <div className="relative h-96">
      <ComboBoxList<Party>
        listId={`story-${withLead}-${withSticky}`}
        label="Party"
        // Anchored where a real one would be. It is drawn against the window, so a story has to
        // give it a place rather than let a parent lay it out.
        anchor={{ left: 0, top: 0, width: 320 }}
        options={PARTIES}
        getKey={(party) => party.id}
        groupOf={(party) => party.group}
        highlight={highlight}
        onHighlight={setHighlight}
        onStickyRow={false}
        onChooseOption={() => undefined}
        listRef={listRef}
        {...(withLead ? { stickyLead: { label: 'Add last used · Freight, Packing charges', onChoose: () => undefined } } : {})}
        {...(withSticky ? { stickyAction: { label: '+ Create "Karthik" as a party', onChoose: () => undefined } } : {})}
        renderRow={(party, { highlighted }) => (
          <div>
            <div className="text-body text-ink">{party.name}</div>
            <div className="flex justify-between text-sm text-ink-muted">
              <span>{party.city}</span>
              {highlighted ? <span>4,179.00 Cr</span> : null}
            </div>
          </div>
        )}
      />
    </div>
  )
}

export const Lists: Story = {
  render: () => (
    <div className="space-y-6 bg-surface-page p-6">
      <div className="max-w-2xl">
        <h1 className="text-title font-strong tracking-tight text-ink">ComboBoxList</h1>
        <p className="mt-1 text-body leading-body text-ink-secondary">
          The panel scrolls in the middle and has a flush foot: the scrolling part is clipped to
          end where the foot begins, so nothing ever shows underneath it. A group heading has a
          line to sit on, or it reads as a stray label. And the row shows more on the HIGHLIGHTED
          row — hovered for a mouse, arrowed-to for a keyboard — which is why this is written by
          hand rather than taken from cmdk.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div>
          <p className="mb-2 text-sm font-label text-ink-secondary">Plain</p>
          <Panel withLead={false} withSticky={false} />
        </div>
        <div>
          <p className="mb-2 text-sm font-label text-ink-secondary">With a row pinned below</p>
          <Panel withLead={false} withSticky />
        </div>
        <div>
          <p className="mb-2 text-sm font-label text-ink-secondary">Pinned above and below</p>
          <Panel withLead withSticky />
        </div>
      </div>
    </div>
  ),
}
