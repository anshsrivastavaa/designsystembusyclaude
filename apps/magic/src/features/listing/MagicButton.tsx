// The AI insight, as a floating button centred over the summary bar.
//
// A BUTTON, NOT A STRIP AND NOT A TOOLBAR ITEM. As a strip it was a paragraph of text between
// the table and the totals that nobody was going to read twice. In the toolbar it would be one
// more thing in a row that is already tight and gets tighter on Windows at 125%. Floating and
// centred, it has the prominence the feature is meant to have and costs the toolbar nothing.
//
// ONE SLOT, AND WHAT IS IN IT DEPENDS ON WHAT YOU ARE DOING. The bulk bar lands in the same
// place when rows are selected, and this steps aside for it: picking rows means acting on
// them, not reading about them. Same rule the other session used for the row gutter.
//
// BORROWED FROM THE MAGIC BUTTON in the AI-insights prototype: a pill in accent ink that fills
// with accent on hover, a sparkle that twinkles, and a one-shot pulse on arrival. What is NOT
// borrowed is the animated gradient border — it needs a keyframe and a colour-mix in the token
// layer, which is not this session's to write, and a flat accent border is honest where a
// half-copied sheen would just look broken.
//
// IT CARRIES A COUNT ONLY WHEN THERE IS SOMETHING WORTH READING. A badge that always says
// something is a badge nobody looks at.

import * as React from 'react'

import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { cn } from '@busy/ui/cn'
import type { Invoice } from '../../data/schema/invoice'
import { insightsFor } from './insights'
import { useListing } from './store'

export function MagicButton({ narrowed }: { narrowed: Invoice[] }) {
  const today = useListing((state) => state.today)
  const setTab = useListing((state) => state.setTab)
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)

  const insights = insightsFor(narrowed, today)
  const worthReading = insights.filter((one) => one.actionable).length

  return (
    <>
      <button
        ref={button}
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={
          worthReading === 0
            ? 'AI insight'
            : `AI insight — ${worthReading} ${worthReading === 1 ? 'thing' : 'things'} worth reading`
        }
        className={cn(
          'flex h-control items-center gap-2 rounded-full border border-accent px-4',
          'bg-surface text-body font-label text-ink-accent shadow-raised transition-colors',
          'hover:bg-accent hover:text-on-accent',
          'focus-ring',
        )}
      >
        <Icon name="sparkle" className="motion-pulse" />
        AI Insight
        {worthReading === 0 ? null : (
          <span className="rounded-full bg-accent px-2 text-sm text-on-accent">{worthReading}</span>
        )}
      </button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="AI insight">
        <div className="flex w-96 flex-col divide-y divide-stroke">
          {insights.map((insight) => (
            <div key={insight.id} className="flex items-start gap-3 px-4 py-3">
              <span className="min-w-0 flex-1 text-body text-ink">{insight.line}</span>
              {insight.showsTab === undefined ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setTab(insight.showsTab!)
                    setOpen(false)
                  }}
                  className="shrink-0 text-body font-label text-ink-accent hover:underline focus-visible:underline focus-visible:outline-none"
                >
                  Show them
                </button>
              )}
            </div>
          ))}
        </div>
      </Popover>
    </>
  )
}
