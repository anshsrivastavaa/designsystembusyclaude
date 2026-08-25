// Every keyboard shortcut in the product, in one table.
//
// Nothing binds a key where it is used. A shortcut set that lives in twenty components cannot
// be changed, cannot be printed, and cannot be checked for two things claiming one key — and
// our two references already disagree about F4, which is exactly the kind of clash a scattered
// set hides until somebody hits it. Which of the two F4 means is not this file's to decide; the
// table exists so that the question can be ASKED at all.
//
// This module says WHICH ACTION a keypress means. What the action does is the screen's
// business, so the table stays free of anything about invoices.

export type Action =
  | 'complete-row'
  | 'next-field'
  | 'previous-field'
  | 'move-left'
  | 'move-right'
  | 'move-up'
  | 'move-down'
  | 'last-filled-row'
  | 'first-row'
  /** The ends of the ROW you are standing on, not of the grid. Ctrl or Command with the same key
   * is the grid's ends, which is the spreadsheet convention people already have in their hands. */
  | 'row-start'
  | 'row-end'
  | 'create-record'
  /** Open the full record's drawer on what has been typed, rather than taking the list's answer.
   * The party field has worn an F10 cap for this since the first round; the item cell had the
   * same drawer and no key at all. */
  | 'open-master'
  // The listing's own set. Same table, because two tables is the scattered set wearing a hat.
  | 'open-record'
  | 'select-record'
  | 'last-row'
  | 'new-document'
  | 'find'
  | 'clear'
  | 'show-help'
  /** Done with this part of the document — go to the next one, and on the last one finish. */
  | 'next-section'

export type Press = {
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
}

/** WHERE a press means something. The same key means different things in different widgets —
 * Enter completes a row in the item grid and opens a record in a listing — and a table keyed
 * only on the key cannot say both. `grid` is the default so every binding written before this
 * existed keeps meaning exactly what it meant. */
export type Where = 'grid' | 'list' | 'global'

type Binding = { key: string; withCommand?: boolean; withShift?: boolean; where?: Where; action: Action }

/** The whole set. Adding a shortcut means adding a line here and nowhere else. */
const BINDINGS: readonly Binding[] = [
  { key: 'Enter', action: 'complete-row' },
  { key: 'Tab', action: 'next-field' },
  { key: 'Tab', withShift: true, action: 'previous-field' },
  { key: 'ArrowLeft', action: 'move-left' },
  { key: 'ArrowRight', action: 'move-right' },
  { key: 'ArrowUp', action: 'move-up' },
  { key: 'ArrowDown', action: 'move-down' },
  // Ctrl or Command with End goes to the last FILLED row, never the last row on screen. The
  // grid pads itself with empty rows, and landing on one of those is landing nowhere.
  { key: 'End', withCommand: true, action: 'last-filled-row' },
  { key: 'Home', withCommand: true, action: 'first-row' },
  // BARE Home AND End ARE THE ENDS OF THE ROW, which is what they mean in every spreadsheet.
  //
  // THEY DO NOT SIMPLY TAKE THE KEY, and that is the whole difficulty. This grid puts a real
  // field under the cursor, so Home and End already mean something there — the ends of the TEXT
  // — and a grid that swallows them takes away the only way to get to the front of a price you
  // are halfway through retyping. v2 never bound them in its item grid for exactly this reason;
  // it uses them in menus, in the date grid and along the listing's headings, and leaves the grid
  // to the field.
  //
  // So the screen decides on the SECOND press: the caret goes to the end of the text, and a
  // press with the caret already there moves the cell cursor. Nothing is lost, and the key is
  // discovered the way Home and End are always discovered, by pressing them twice.
  { key: 'Home', action: 'row-start' },
  { key: 'End', action: 'row-end' },
  // F2 creates the record you are looking at. The previous build used it this way and the
  // people who will use this one already have it in their hands.
  { key: 'F2', action: 'create-record' },
  // F10 OPENS THE FULL RECORD FOR WHAT IS BEING TYPED. Aj's ruling is that F10 opens the master;
  // there is no party master screen yet, which is why the party field's cap still only advertises
  // the field. There IS an item drawer, so the item half is bound here — and it is bound in this
  // table rather than in the cell, like every other key in the product.
  //
  // IT IS THE ONLY KEYBOARD DOOR THE ITEM DRAWER HAS. Before this the drawer opened from the
  // list's "+ Create item" row and from nowhere else, which is a mouse-only path to the one place
  // an item gets a unit, a tax category and an HSN.
  { key: 'F10', action: 'open-master' },
  // SHIFT AND SPACE PICKS THE LINE THE CURSOR IS ON. Space alone types a space into the cell
  // you are standing in, which is why the grid cannot use the listing's plain Space — the
  // listing has no field under the cursor and this does.
  { key: ' ', withShift: true, action: 'select-record' },

  // The listing. Arrows walk the rows, Enter opens the one you are on, Space picks it without
  // opening it, and Home and End go to the ends of the page you are looking at.
  { key: 'ArrowUp', where: 'list', action: 'move-up' },
  { key: 'ArrowDown', where: 'list', action: 'move-down' },
  { key: 'Enter', where: 'list', action: 'open-record' },
  { key: ' ', where: 'list', action: 'select-record' },
  { key: 'Home', where: 'list', action: 'first-row' },
  { key: 'End', where: 'list', action: 'last-row' },

  // Anywhere on a screen, as long as nothing is being typed into. The screen decides that —
  // a table cannot know where the keyboard is — but the MEANING of the key is decided here.
  // F2 MEANS "DONE WITH THIS SECTION" ON A SCREEN, and "create this record" inside a drawer.
  // Two entries rather than one, because `where` is exactly the thing that tells them apart —
  // and the drawer's F2 was already here and is untouched.
  { key: 'F2', where: 'global', action: 'next-section' },
  { key: '/', where: 'global', action: 'find' },
  { key: 'n', where: 'global', action: 'new-document' },
  { key: 'Escape', where: 'global', action: 'clear' },
  // "?" opens the shortcut legend. The v2 build already does this and its users already have
  // it in their hands, so it is taken rather than re-chosen.
  { key: '?', where: 'global', action: 'show-help' },
]

export function actionFor(press: Press, where: Where = 'grid'): Action | null {
  const command = press.ctrlKey === true || press.metaKey === true
  const shift = press.shiftKey === true

  for (const binding of BINDINGS) {
    if ((binding.where ?? 'grid') !== where) continue
    if (binding.key !== press.key) continue
    if ((binding.withCommand === true) !== command) continue
    if ((binding.withShift === true) !== shift) continue
    return binding.action
  }
  return null
}

/** Everything bound, for the day this has to be shown to somebody or checked for a clash. */
export const boundKeys = BINDINGS.map((binding) => ({
  key: binding.key,
  command: binding.withCommand === true,
  shift: binding.withShift === true,
  where: binding.where ?? 'grid',
  action: binding.action,
}))
