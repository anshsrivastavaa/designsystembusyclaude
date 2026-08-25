// Breaking the invoice into parts, each with its own due date.
//
// ITS OWN SURFACE AND NOT A SECTION IN SETTLEMENT (ruled). Twenty-four instalments inside a popover
// is the reason; settlement shows the summary and this is what the summary opens.
//
// THE TOP ROW DICTATES EVERYTHING UNDER IT, WITH NO GENERATE BUTTON (Aj, 24-08). Parts, start date
// and gap in days; changing any of them re-spreads the table below immediately. Amounts and dates
// stay editable afterwards — and the moment one is edited the top row stops re-spreading, which is
// v2's rule carried over. See splitSchedule.ts for why.
//
// EVERY RUPEE HAS TO LAND SOMEWHERE, and that is the only thing this refuses. Dates out of order,
// uneven amounts, a part added by hand — all of those are things somebody might genuinely have
// agreed with a customer, and a surface that argues with them is a surface being clever.

import { Button } from '@busy/ui/Button'
import { Drawer } from '@busy/ui/Drawer'
import { dayText, today } from '../../lib/day'
import { formatPaise, toPaise } from '../../lib/money'
import { RemoveFromList } from './RemoveFromList'
import { useInvoice } from './store'
import { partsWanted, scheduled, shortfall } from './splitSchedule'

export function SplitDrawer({
  open,
  onClose,
  totalPaise,
}: {
  open: boolean
  onClose: () => void
  /** What the invoice comes to. Handed in rather than worked out again — it is already worked out
   * once for the breakdown, and twice is how two figures disagree. */
  totalPaise: number
}) {
  const parts = useInvoice((state) => state.splitParts)
  const plan = useInvoice((state) => state.splitPlan)
  const touched = useInvoice((state) => state.splitTouched)
  const planSplit = useInvoice((state) => state.planSplit)
  const setPartAmount = useInvoice((state) => state.setPartAmount)
  const setPartDue = useInvoice((state) => state.setPartDue)
  const addPart = useInvoice((state) => state.addPart)
  const removePart = useInvoice((state) => state.removePart)
  const clearSplit = useInvoice((state) => state.clearSplit)

  const left = shortfall(totalPaise, parts)

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Split this invoice"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* REMOVING THE SPLIT IS AN ORDINARY ANSWER, not a destructive one, so it is quiet ink
              and not the alarm colour. It is also the only way back to accepting new lines. */}
          <Button variant="ghost" onClick={() => { clearSplit(); onClose() }}>
            Remove the split
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      }
    >
      {/* THE TOP ROW. No Generate: typing in any of the three re-spreads the table below as you
          type, which is what makes it read as one control over the table rather than a form. */}
      <div className="mb-4 flex flex-wrap items-end gap-3 rounded-card border border-stroke bg-surface-sunken px-3 py-2">
        <label className="flex flex-col gap-1">
          <span className="text-caps font-strong tracking-wide text-ink-secondary uppercase">Parts</span>
          <input
            inputMode="numeric"
            value={plan.parts}
            onChange={(event) => planSplit({ parts: partsWanted(Number(event.target.value)) }, totalPaise)}
            className="h-control-sm w-20 rounded-control border border-stroke bg-surface px-2 text-right focus-ring"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caps font-strong tracking-wide text-ink-secondary uppercase">Starts</span>
          <input
            type="date"
            value={plan.startDate === '' ? today() : plan.startDate}
            onChange={(event) => planSplit({ startDate: event.target.value }, totalPaise)}
            className="h-control-sm rounded-control border border-stroke bg-surface px-2 focus-ring"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-caps font-strong tracking-wide text-ink-secondary uppercase">Gap in days</span>
          <input
            inputMode="numeric"
            value={plan.gapDays}
            onChange={(event) => planSplit({ gapDays: Math.max(0, Number(event.target.value) || 0) }, totalPaise)}
            className="h-control-sm w-24 rounded-control border border-stroke bg-surface px-2 text-right focus-ring"
          />
        </label>
        {touched ? (
          // SAID OUT LOUD, because a control that silently stops working is worse than one that
          // is not there. The figures below are the person's now, and the top row says so.
          <p className="w-full text-sm text-ink-secondary">
            The parts below have been edited by hand, so these no longer re-spread them.
          </p>
        ) : null}
      </div>

      <ul className="flex flex-col gap-1">
        {parts.map((part, at) => (
          <li key={part.id} className="flex items-center gap-2 text-body">
            <span className="w-8 shrink-0 text-right text-sm text-ink-muted">{at + 1}</span>
            <input
              type="date"
              aria-label={`Due date for part ${at + 1}`}
              value={part.due}
              onChange={(event) => setPartDue(part.id, event.target.value)}
              className="h-control-sm flex-1 rounded-control border border-stroke bg-surface px-2 focus-ring"
            />
            <input
              inputMode="decimal"
              aria-label={`Amount for part ${at + 1}`}
              value={formatPaise(part.amountPaise)}
              onChange={(event) => setPartAmount(part.id, toPaise(event.target.value))}
              className="h-control-sm w-32 shrink-0 rounded-control border border-stroke bg-surface px-2 text-right focus-ring"
            />
            <RemoveFromList label={`Remove part ${at + 1}`} onRemove={() => removePart(part.id)} />
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => addPart(parts.at(-1)?.due ?? today())}
        className="mt-2 rounded-control px-2 py-1 text-body text-ink-accent hover:bg-surface-hover focus-ring"
      >
        + Add a part
      </button>

      {/* WHAT IS LEFT IS THE TABLE'S OWN LAST LINE, under the amounts it totals — v2 puts it there
          and its reason holds: the eye is already at the bottom of that column. */}
      <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-stroke pt-3">
        <span className="text-ink-secondary">
          {left === 0 ? 'All of it is placed' : left > 0 ? 'Still to place' : 'Over the invoice by'}
        </span>
        <span className={left === 0 ? 'text-ink' : 'font-label text-danger'}>
          {formatPaise(Math.abs(left))}
        </span>
      </div>
      <div className="mt-1 flex items-baseline justify-between gap-4 text-sm text-ink-secondary">
        <span>{parts.length} {parts.length === 1 ? 'part' : 'parts'} · first due {dayText(parts[0]?.due ?? today())}</span>
        <span>{formatPaise(scheduled(parts))} of {formatPaise(totalPaise)}</span>
      </div>
    </Drawer>
  )
}
