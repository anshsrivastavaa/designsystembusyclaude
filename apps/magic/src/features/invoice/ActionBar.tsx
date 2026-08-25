// The bar across the bottom, and it does ONE job: actions.
//
// v2's arrangement, and it is the single biggest structural difference between the two
// screens: v2 has a fixed bar, ours had Save floating in the page header where it read as a
// page title's neighbour rather than as the end of a task.
//
// LEFT IS STATE, RIGHT IS ACTION. Unpaid or Paid and the derived part-paid chip on the left; the
// two compliance switches, Hold and Save on the right. Everything at one control height — that
// rhythm is the whole point of a bar rather than a stack, and it is true again: the bar was 130
// and two rows while the save configuration was loose on it, and is 68 and one row now that the
// configuration lives behind Save's caret.
//
// THE COMPLIANCE SWITCHES ARE ON THE RIGHT BECAUSE THEY ARE ABOUT THE SAVE. "On at save means
// generated at save" is a sentence about the button, and the switch was a bar's width away from
// it.
//
// PARTLY PAID IS A CHIP, NEVER A THIRD TAB. Unpaid and Paid are things you set; part-paid is
// what the arithmetic says, and a tab you cannot choose is a tab that lies about being one.
//
// IT IS THE ONE PINNED THING ON THIS SCREEN. The header, the party row, the grid and the
// footer all scroll past together; this stays, because an action you cannot reach is an action
// you scroll to find.

import { Button } from '@busy/ui/Button'
import { Tabs } from '@busy/ui/Tabs'
import { formatPaise } from '../../lib/money'
import { ComplianceSwitches } from './ComplianceSwitches'
import { SaveTail } from './SaveTail'
import type { Landing, SenderSwitches } from './afterSave'

/** The two you SET. Part-paid is not here and never will be: it is what the arithmetic says, so
 * it is the chip below rather than a third option nobody can choose. */
const PAYMENT_STATES = [
  { value: 'unpaid' as const, label: 'Unpaid' },
  { value: 'paid' as const, label: 'Paid' },
]

export type ActionBarProps = {
  paid: boolean
  onPaid: (paid: boolean) => void
  /** What is left to collect. Zero means nothing is outstanding. */
  balancePaise: number
  onHold: () => void
  onSave: () => void
  /** The three copy-of-the-document switches on the tail. The two compliance ones are not here:
   * they are a different question and they have their own pair. */
  tail: SenderSwitches
  onTailSwitch: (key: keyof SenderSwitches, on: boolean) => void
  /** Where the save lands, chosen behind the caret rather than by pressing a second button. */
  landing: Landing
  onLanding: (landing: Landing) => void
  saving: boolean
  /** What just happened, or what went wrong. Sits with the button that caused it. */
  message?: string | null
  refused?: boolean
}

export function ActionBar({
  paid,
  onPaid,
  balancePaise,
  onHold,
  onSave,
  tail,
  onTailSwitch,
  landing,
  onLanding,
  saving,
  message,
  refused = false,
}: ActionBarProps) {
  const partly = !paid && balancePaise > 0

  return (
    <div
      aria-label="Invoice actions"
      className="sticky bottom-0 z-20 flex shrink-0 flex-wrap items-center gap-3 rounded-card border border-stroke bg-surface px-3 py-2"
    >
      {/* THE TRAY RUNS TWO PIXELS PROUD OF THE BAR AT COMPACT, AND IT IS PARKED ON packages/ui.
          Measured on 25-08: E-Way Bill, E-Invoice and Hold are all 32, Save is 38 because it is
          deliberately the emphasised control, and this tray is 34 — `p-1` around an
          `h-control-sm` button, which is 26 + 8. At comfortable it comes out exact, 36 + 8 = 44.
          It is centred rather than misaligned, so the bar simply grows by those two; that is why
          it was adopted anyway rather than left hand-written.
          v2 MET THIS AND FIXED IT: in the bar layout its `.payseg` carries `height:var(--control-h)`
          with the buttons' own minimum stripped, so the padding is absorbed instead of added. The
          fix belongs there too — one height on the tray, not a class added here — so no test is
          committed asserting the bar's rhythm yet. A test written today would have to assert 34,
          which is a check defending the fault.

          THE SEGMENTED CONTROL IS Tabs look="tray", not two buttons in a well. Hand-written it
          was two `aria-pressed` buttons inside a `role="group"` — which says "two things you can
          push in" rather than "one choice out of two" — and both were tab stops, so getting from
          the bar's left edge to Save cost a press more than it needed to. Now Tab passes the pair
          in one and the arrow keys move the choice. */}
      <Tabs
        look="tray"
        label="Payment state"
        value={paid ? 'paid' : 'unpaid'}
        onChange={(which) => onPaid(which === 'paid')}
        options={PAYMENT_STATES}
      />

      {partly ? (
        // DERIVED, and it says so by being a chip rather than a control. Nobody sets this.
        <span className="flex h-control items-center rounded-pill border border-stroke px-3 text-sm text-ink-secondary">
          Partly paid · balance {formatPaise(balancePaise)}
        </span>
      ) : null}

      <span className="flex-1" />

      {/* THE WHOLE RIGHT-HAND SIDE IS ONE GROUP, and that is not tidiness. The spacer above pushes
          whatever comes next to the right edge, so with Hold and the tail as separate children the
          bar wrapped the moment the tail arrived: Hold stayed on the first row, alone, and
          everything that acts on the invoice dropped to a second. One group means the wrap, when
          it comes, takes the actions together. */}
      <div className="flex items-center gap-3">
        {/* THE TWO COMPLIANCE SWITCHES SIT WITH HOLD AND SAVE (Aj, 25-08). They were over on the
            left with the payment state, a bar's width away from the button whose press is what
            makes them mean anything — "on at save" is a sentence about Save, so the switch belongs
            beside it.
            ONE COMPONENT, TWO ROOMS. The same pair is in the transport drawer and neither place
            holds its own copy, which is also why the wording cannot drift between them: there is
            one set of words, in one file. See ComplianceSwitches.tsx. */}
        <ComplianceSwitches />

        {message == null ? null : (
          <span role={refused ? 'alert' : 'status'} className={`max-w-xs text-sm ${refused ? 'text-danger' : 'text-success'}`}>
            {message}
          </span>
        )}

        <Button variant="ghost" onClick={onHold}>
          Hold
        </Button>
        {/* SAVE IS A SPLIT BUTTON: a face that always saves, and a caret holding what happens
            around it — see SaveTail.tsx. */}
        <SaveTail
          switches={tail}
          onSwitch={onTailSwitch}
          landing={landing}
          onLanding={onLanding}
          onSave={onSave}
          saving={saving}
        />
      </div>
    </div>
  )
}
