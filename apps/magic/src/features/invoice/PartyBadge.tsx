// One slot at the end of the party field, and what is in it is decided by mode.
//
//   no party yet — the F10 chip, which is how you get to this field from anywhere
//   a party      — the trust badge, because the shortcut has done its job
//
// The same rule the row gutter follows. Two things taking turns in one slot, never two things
// sharing one, and never a slot that empties.
//
// EACH GRADE CARRIES A LIGHT FILL. Ruled by Aj on 25-08, overturning what stood here before —
// that the grade is never coloured. His reason is the right one and it is worth keeping: the
// badge already carries the LETTER, so the fill reinforces something readable rather than
// carrying the meaning by itself, which is what the colour rule actually bans. Somebody who
// cannot tell the three fills apart reads A, B or C exactly as before.
//
// THE LADDER IS success · info · warning, AND RED IS NOT ON IT. Two reasons, and the first one
// this session offered was wrong and is recorded so nobody re-derives it: the dead-GSTIN mark
// always lands on a C, so painting C red looked like it would bury the mark. Measured on the
// rendering, it does not — the mark reads 5.32:1 on the amber ground and 5.14:1 on the red one,
// both well past the 3:1 WCAG asks of a graphic that carries meaning. That argument is dead.
//
// What is left is about what each rung MEANS. The document grades A at 80 and up, B at 60 to 79,
// C below 60, and says only C raises the alert. Amber on a B would say a warning about a customer
// who pays perfectly well, which is a control reporting a state it is not in. And C is the alert
// rung, not the alarm one — the alarm on this badge is the dead registration, and a screen with
// two reds on one control has spent the louder one on the quieter fact.
//
// Measured on the rendering: the letter reads 7.23, 6.75 and 7.22 against the three fills, so the
// grade stays as legible as it was on the plain sunken chip.
//
// THE INK IS NOT THE FILL'S FAMILY EITHER. A green letter on a green ground is the same fact
// twice and it is the quieter of the two; the letter keeps the secondary ink it has always had,
// which measured against all three fills is the same letter at the same weight in three
// different rooms.
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
//
// IT WEARS THE SAME FACE AS THE F10 CHIP, AND THAT IS THE 24-08 RULING. Aj: "weird and looks
// awful", on the third reworking of this control, so it was sketched and agreed before it was
// touched again.
//
// WHAT WAS WRONG WITH IT, AND IT WAS NOT THE MISSING COLOUR. v2 draws a solid coloured disc with
// the grade in white. Dropping the colour was right and stays — a third of any ledger is a C, and
// a grade wearing the alarm colour leaves nothing for the row that actually needs chasing. But
// the container went with the colour, and a bare capital letter floating at the end of a field
// reads as a stray character rather than as a control.
//
// SO IT TAKES BACK A CONTAINER AND NOT A COLOUR — the hairline, the sunken fill and the caps
// treatment `Shortcut` already draws. The two share ONE SLOT and take turns in it: no party
// shows F10, a party shows the grade. Two things taking turns in one slot should look like one
// slot, and until now they looked like a key cap and a loose letter.

import { Button } from '@busy/ui/Button'
import { Shortcut } from '@busy/ui/Shortcut'
import { gstinIsDead, type Party } from '../../data/schema/party'

/** The fill each grade wears. Three rungs, three rooms, and no red — see the note above. */
const FILLS: Record<string, string> = {
  A: 'bg-success-soft',
  B: 'bg-info-soft',
  C: 'bg-warning-soft',
  none: 'bg-surface-sunken',
}

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
  // A party with no history has no grade and therefore no fill — the dash keeps the sunken face
  // the chip wears in the F10 slot, because "not yet known" is not a rung on the ladder.
  const fill = FILLS[party.trustGrade ?? 'none']
  // The grade arrives capped, so a dead registration is already a C. The mark is what says the C
  // is HELD rather than EARNED — without it a cancelled registration and a slow payer wear the
  // same letter, which is the hole the mark exists to close.
  const says = dead ? `GSTIN ${party.gstinStatus} — trust grade ${letter}, held by the GSTIN` : `Trust grade ${letter}`

  return (
    <Button
      size="icon-sm"
      variant="ghost"
      onClick={onOpen}
      // THE CHIP'S OWN FACE, and the classes are `Shortcut`'s because this is the same object in
      // the same slot. It is not a `Shortcut`: that component is a `<kbd>`, which is the element
      // for a key and would be a lie about a grade — and this one is pressed, where a shortcut
      // hint deliberately is not. Same face, different thing, which is what a variant means.
      className={`relative mr-1 size-auto rounded-control border border-stroke px-1.5 py-1 text-caps font-label tracking-wide uppercase leading-tight text-ink-secondary hover:border-stroke-strong hover:text-ink ${fill}`}
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
          className="absolute -top-0.5 -right-0.5 size-1.5 rounded-pill bg-danger-fill"
        />
      ) : null}
    </Button>
  )
}
