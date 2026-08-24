// One slot at the end of the party field, and what is in it is decided by mode.
//
//   no party yet — the F10 chip, which is how you get to this field from anywhere
//   a party      — the trust badge, because the shortcut has done its job
//
// The same rule the row gutter follows. Two things taking turns in one slot, never two things
// sharing one, and never a slot that empties.
//
// THE GRADE IS NEVER COLOURED. v2 colours every one — green A and B, amber C, red D and E —
// which turns a grade into a colour and spends the alarm colour on the most routine fact in the
// header. Roughly a third of any ledger is a C.
//
// ONE MARK, FOR A DEAD GSTIN AND NOTHING ELSE. Ruled by Aj on 23-08. Cancelled, suspended or
// inactive, and the badge gains a mark; nothing else touches it.
//
// NOT FOR A CROSSED CREDIT LIMIT AND NOT FOR AN OVERDUE BILL, and the reason is the moment
// rather than the severity: both of those depend on what this invoice comes to, and at the
// moment you pick the party there is no invoice yet. They are checked at SAVE, allow / warn /
// block, against a total that exists. **The row warns about FACTS; save warns about
// CONSEQUENCES.**
//
// WHY THE MARK IS NEEDED AT ALL. Going from five grades to three took the alarm off the badge —
// C is now everything below sixty — so a cancelled registration came to look exactly like a
// party who simply pays late. Journey 8 is "know that a party's GSTIN has been cancelled before
// you bill them". The grade cap stays; this stops the cap being the only place the fact shows.
//
// THREE CHANNELS, NEVER COLOUR ALONE: the mark is a SHAPE the badge does not otherwise have, it
// is red because a dead registration is genuinely the exceptional case, and the badge's
// accessible name and tooltip say it in words.

import { Button } from '@busy/ui/Button'
import { Shortcut } from '@busy/ui/Shortcut'
import { gstinIsDead, type Party } from '../../data/schema/party'

export function PartyBadge({ party, onOpen }: { party: Party | null; onOpen: () => void }) {
  if (party === null) {
    return (
      // THE FACE COMES FROM Shortcut, which exists precisely because this chip had been
      // hand-written three times over. What stays here is the only thing that is this field's
      // business: WHEN it shows.
      //
      // SHOWN ONLY WHILE THE FIELD IS HOVERED OR HOLDS THE KEYBOARD, which is v2's behaviour and
      // the third round on this. A shortcut hint that is on all the time is a permanent label on
      // the field you are least likely to need telling about — the party field is where every
      // invoice already starts. It is not a control either: pressing the chip is not how you use
      // a shortcut.
      <Shortcut
        keyName="F10"
        className="pointer-events-none mr-2 opacity-0 transition-opacity group-hover/party:opacity-100 group-focus-within/party:opacity-100"
      />
    )
  }

  // A DASH, NOT NOTHING, for a party with no history. The document says show nothing — but
  // nothing means no badge, no badge means no door, and a brand-new party would then have no way
  // to reach their GSTIN status at all. Filed for stakeholders.
  const letter = party.trustGrade ?? '–'
  const dead = gstinIsDead(party.gstinStatus)
  // The grade arrives capped, so a dead registration is already a C. The mark is what says the C
  // is HELD rather than EARNED — without it a cancelled registration and a slow payer wear the
  // same letter, which is the hole the mark exists to close.
  const says = dead ? `GSTIN ${party.gstinStatus} — trust grade ${letter}, held by the GSTIN` : `Trust grade ${letter}`

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      onClick={onOpen}
      className="relative mr-1 rounded-control font-label text-ink-secondary"
      // The reason is the NAME, so it is read out rather than only seen.
      aria-label={says}
      title={says}
    >
      {letter}
      {dead ? (
        <span
          aria-hidden
          // ON THE LETTER, NOT ON THE FIELD'S CORNER. It sat at the button's OUTER corner, which
          // on screen is the party field's own rounded corner — so it read as a notification dot
          // belonging to the field, detached from the letter it qualifies, and at ordinary size
          // it looked like a stray pixel on the border.
          //
          // It qualifies the GRADE, so it sits on the grade: the letter's top shoulder, inside
          // the badge. That is where a footnote marker goes, and a footnote is what it means —
          // this C is held, see why. The baseline was tried first and reads as a full stop.
          //
          // It still takes no width. A mark that pushed the layout would move the party field's
          // contents the first time a party had a dead registration, which is the one moment
          // nothing else should move.
          className="absolute top-0.5 right-0.5 size-1.5 rounded-pill bg-danger-fill"
        />
      ) : null}
    </Button>
  )
}
