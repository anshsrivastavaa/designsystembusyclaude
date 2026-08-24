// The line docked under a header field, saying what is in effect on it.
//
// THE PARTNER OF THE LABEL POPOVER. Moving a setting onto a label takes it off the screen,
// which is the point — and it would also take it out of sight, which is not. So a field whose
// behaviour is not the usual one says so, right under itself, where the person is already
// looking.
//
// IT IS ABSENT, NOT EMPTY, WHEN THERE IS NOTHING TO SAY. A permanent "Auto" under every field
// is the same noise the popover was built to remove, and a reserved blank line pushes the item
// table down the screen for nothing. Nothing to say is the normal state; that is what makes
// the line worth reading on the day it appears.

export function InEffect({ children }: { children: string | null }) {
  if (children === null || children === '') return null
  return <p className="mt-1 truncate text-sm text-ink-secondary">{children}</p>
}
