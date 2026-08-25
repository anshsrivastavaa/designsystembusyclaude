import type { Meta, StoryObj } from '@storybook/react-vite'
import { DemoRow } from '../../.storybook/demo'
import * as React from 'react'

import { Disclosure } from './Disclosure'

const meta = {
  title: 'Library/Disclosure',
  component: Disclosure,
} satisfies Meta<typeof Disclosure>

export default meta

function Lines({ what }: { what: string }) {
  return (
    <div className="space-y-1 text-body text-ink">
      <p>{what}</p>
      <p className="text-ink-secondary">And a second line, so the fold has something to move.</p>
    </div>
  )
}

/** The four sections that wanted this, drawn together so the shape can be compared in one look
 *  rather than by opening four screens. */
export const Everything: StoryObj = {
  render: () => {
    const [breakdown, setBreakdown] = React.useState(true)
    return (
      <div className="min-h-screen bg-surface-page px-8 py-10 text-ink">
        <h1 className="text-title font-strong tracking-tight text-ink">Disclosure</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          A word, a chevron that turns over, and whatever is under it. Four sections were written
          separately before this existed and all four had already agreed on the shape.
        </p>

        <div className="mt-6 max-w-2xl rounded-card border border-stroke bg-surface p-2">
          <DemoRow label="Closed by default" align="top">
            <Disclosure summary="Tax summary">
              <Lines what="Nothing here is visible until it is opened." />
            </Disclosure>
          </DemoRow>

          <DemoRow label="Open by default" align="top">
            <Disclosure summary="Breakdown" defaultOpen>
              <Lines what="This one starts open, like the invoice breakdown does." />
            </Disclosure>
          </DemoRow>

          <DemoRow
            label="Something to show while closed"
            align="top"
            note="A folded section you would otherwise have to open just to check."
          >
            <Disclosure summary="Narration" closedAside="Delivered to the Nashik godown…">
              <Lines what="The whole note, once it is open." />
            </Disclosure>
          </DemoRow>

          <DemoRow label="As a way in, not a heading" align="top">
            <Disclosure summary="More fields" tone="accent">
              <Lines what="The drawer's extra fields read as a link rather than a section." />
            </Disclosure>
          </DemoRow>

          <DemoRow
            label="Flush"
            align="top"
            note="A full-bleed table whose top rule has to meet the card's sides, and a body already aligned to the card's own padding. Both were adopters; both needed the padding gone, for opposite reasons."
          >
            <Disclosure summary="Tax summary" flush defaultOpen>
              <div className="border-t border-stroke bg-surface-sunken px-3 py-2 text-body text-ink">
                A rule that runs edge to edge
              </div>
            </Disclosure>
          </DemoRow>

          <DemoRow label="Controlled from outside" align="top">
            <div className="flex items-center gap-3">
              <Disclosure summary="Breakdown" open={breakdown} onOpenChange={setBreakdown}>
                <Lines what="Its state lives in the story, not in the component." />
              </Disclosure>
              <button
                type="button"
                onClick={() => setBreakdown((was) => !was)}
                className="h-control-sm shrink-0 rounded-control border border-stroke px-3 text-sm focus-ring"
              >
                {breakdown ? 'Close it' : 'Open it'}
              </button>
            </div>
          </DemoRow>
        </div>
      </div>
    )
  },
}
