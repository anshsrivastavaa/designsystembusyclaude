// WHERE THE CARET IS, ASKED OF THE ELEMENT RATHER THAN REMEMBERED.
//
// Its own file because ItemGrid.tsx was at the 250-line cap and this is not more grid — it is one
// fact about the keyboard, which the grid then decides what to do about.

/** Whether the keyboard is in a text field with its caret already against the end named.
 *
 * ASKED OF THE ELEMENT, NOT REMEMBERED. A flag saying "they pressed Home last time" goes stale
 * the moment somebody clicks into the middle of the text, and then the next Home jumps the cursor
 * out of a cell they were editing. The caret's position is the fact; a memory of it is a guess.
 *
 * Not a field at all — a worked-out cell, which is a div — means there is no text to walk, so
 * the key is the grid's straight away. */
export function caretIsAt(active: Element | null, end: 'start' | 'end'): boolean {
  if (!(active instanceof HTMLInputElement)) return true
  const { selectionStart, selectionEnd, value } = active
  if (selectionStart === null || selectionEnd === null) return true
  // A selection spanning any of the text is not a caret sitting at an end, even when one of its
  // edges is. Selecting the whole cell and pressing Home collapses to the front, which is what
  // the field should do, and this grid should not steal it.
  if (selectionStart !== selectionEnd) return false
  return end === 'start' ? selectionStart === 0 : selectionStart === value.length
}
