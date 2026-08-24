// Whether the keyboard is in something a person is typing into.
//
// ONE ANSWER, BECAUSE THERE WERE TWO AND NEITHER WAS RIGHT. The listing asked "input or select",
// the help menu asked "input or textarea", so a global shortcut fired into a textarea on one
// screen and into a select on the other. Both were reasonable guesses at the same question and
// the question has one answer.
//
// IT IS NOT IN shortcuts.ts, which decides what a KEY MEANS. This decides whether the key was
// meant for the screen at all, which is a different question and the one a shortcut table
// cannot answer: it has no idea where the keyboard is.
//
// A SELECT COUNTS. It is not typing in the literal sense, but a select consumes letter keys to
// jump between its options — press "n" on a rows-per-page picker and it looks for an option
// starting with n. A global "n creates a new invoice" would steal that.

/** True when the event's target takes the keystroke for itself. */
export function isTyping(target: EventTarget | null): boolean {
  if (target instanceof HTMLInputElement) return true
  if (target instanceof HTMLTextAreaElement) return true
  if (target instanceof HTMLSelectElement) return true
  // Anything a person can edit in place — a rich-text note, a cell that became editable.
  return target instanceof HTMLElement && target.isContentEditable
}
