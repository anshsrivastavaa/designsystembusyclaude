// Every setting, in one list, in the order they appear down the screen they control.
//
// NOT CALLED settings.ts, and the reason is worth a line: this machine's filesystem does not
// tell `settings.ts` and `Settings.tsx` apart, so the drawer importing the list resolved to
// itself and the build failed with "Settings is not exported by settings.ts". It would have
// worked on CI's Linux and broken again on the next Mac. A catalogue is what this is anyway.
//
// THE DRAWER IS A MAP OF THE SCREEN, top to bottom — header and numbering, party, item table,
// tax, sundries, totals and saving. You find a setting by remembering where the thing it
// controls sits, not by remembering what somebody called it. That is v2's arrangement and it
// is the reason the list is ordered rather than alphabetical.
//
// A LIST, NOT MARKUP. Every setting is data with a zone, a label and a kind, so the search, the
// zone tabs and the rendering all read the same thing. Written as markup, a new setting has to
// be added in three places and the third is the one that gets missed.
//
// PARKED IS A STATE, NOT AN OMISSION. A setting the product document names, that the invoice
// has no surface for yet, is shown switched off and saying so. Guessing at it would be worse
// than an obvious blank, and leaving it out reads as finished.
//
// EVERY SETTING HERE IS EITHER MAPPED OR PARKED, and a test holds it BOTH WAYS. The second
// direction earned its keep within the hour: the other session wired four of the extra item
// columns, and this file still had them switched off with a reason — a control that works,
// disabled, telling somebody the product cannot do a thing it can. Nobody presses a switch that
// is already off to find out, so nothing else would ever have caught it.
// Nine of them were
// neither for a day: they wrote to the store, nothing read them, and the switch looked as live
// as the ones that work — which is the same fault as an enabled button that does nothing, in a
// place nobody would think to check. `lib/invoiceSettingsFrom.ts` is the list of what reaches
// the invoice; anything not on it wears a reason.

export type Zone = 'header' | 'party' | 'itemTable' | 'tax' | 'sundries' | 'totals'

export const ZONES: { id: Zone; label: string }[] = [
  { id: 'header', label: 'Header & numbering' },
  { id: 'party', label: 'Party' },
  { id: 'itemTable', label: 'Item table' },
  { id: 'tax', label: 'Tax' },
  { id: 'sundries', label: 'Sundries' },
  { id: 'totals', label: 'Totals & saving' },
]

export type Option = { value: string; label: string; note?: string }

export type Setting =
  /** On or off, and it takes effect as it moves. */
  | { kind: 'switch'; id: string; zone: Zone; group?: string; label: string; note?: string; parked?: string }
  /** One of several, each naming what it does. A choice rather than a switch wherever a switch
   * would leave "and otherwise what?" unanswered — tax off an item line has to go somewhere. */
  | { kind: 'choice'; id: string; zone: Zone; group?: string; label: string; note?: string; parked?: string; options: Option[] }
  /** Something the drawer says rather than something it sets. A pointer to where a setting
   * really lives counts: a second copy of a control is worse than a sentence. */
  | { kind: 'note'; id: string; zone: Zone; group?: string; label: string }

const YES_NO_BLOCK: Option[] = [
  { value: 'allow', label: 'Allow', note: 'no warning' },
  { value: 'warn', label: 'Warn', note: 'flag it, allow save' },
  { value: 'block', label: 'Block', note: 'prevent save' },
]

export const SETTINGS: Setting[] = [
  // ---- Header & numbering ----
  {
    kind: 'choice', id: 'series', zone: 'header', label: 'Series',
    options: [{ value: 'sales', label: 'Sales' }, { value: 'export', label: 'Export' }, { value: 'retail', label: 'Retail' }],
    parked: 'The invoice has no series to change yet'
  },
  {
    kind: 'choice', id: 'duplicateNumber', zone: 'header', label: 'If the number is already used',
    options: YES_NO_BLOCK,
    parked: 'The invoice does not check its number against the book yet'
  },
  {
    kind: 'switch', id: 'billShip', zone: 'header', label: 'Capture Bill-to / Ship-to',
    note: 'on party select, confirm GSTIN and address',
    parked: 'The invoice has no ship-to to capture yet'
  },

  // ---- Party ----
  {
    kind: 'switch', id: 'partyBalance', zone: 'party', label: 'Show the party balance on the header',
    parked: 'The party header always shows the balance today'
  },
  {
    kind: 'switch', id: 'creditWarning', zone: 'party', label: 'Warn when a party is over its credit limit',
    parked: 'The invoice has no credit-limit check yet'
  },

  // ---- Item table ----
  { kind: 'switch', id: 'itemDiscount', zone: 'itemTable', label: 'Item-wise discount', note: 'off hides the discount columns' },
  { kind: 'switch', id: 'secondDiscount', zone: 'itemTable', label: 'Second discount level', note: 'a further discount on what is left after the first', parked: 'waits on the first discount column' },
  { kind: 'switch', id: 'itemDescription', zone: 'itemTable', label: 'Description line under each item', note: 'an optional note about this line on this invoice', parked: 'the row is one line tall and a second line is its own decision' },
  { kind: 'switch', id: 'priceHistory', zone: 'itemTable', label: 'Price history', note: 'the last price to this customer and to others', parked: 'the adapter has no price history to serve' },
  { kind: 'switch', id: 'consolidate', zone: 'itemTable', label: 'Consolidate duplicate items', note: 'merge the same item into one line', parked: 'rows are never merged today, which is its own ruling in the schema' },
  { kind: 'switch', id: 'showStock', zone: 'itemTable', label: 'Show the current stock balance in the item row', parked: 'stock shows on the highlighted row of the item picker and nowhere else yet' },
  {
    kind: 'switch', id: 'conditionalDiscount', zone: 'itemTable', label: 'Conditional discounts',
    parked: 'The product document names this and never says what it does',
  },

  // These four reach the grid: the other session wired them, and this file had them switched
  // off with a reason until the both-ways test caught it.
  { kind: 'switch', id: 'colHsn', zone: 'itemTable', group: 'Extra item columns', label: 'HSN / SAC' },
  { kind: 'switch', id: 'colMrp', zone: 'itemTable', group: 'Extra item columns', label: 'MRP' },
  { kind: 'switch', id: 'colAlias', zone: 'itemTable', group: 'Extra item columns', label: 'Item alias' },
  {
    kind: 'switch', id: 'colFreeQty', zone: 'itemTable', group: 'Extra item columns',
    label: 'Free quantity', note: 'comes out of stock, not off the amount',
  },
  { kind: 'switch', id: 'colWarehouse', zone: 'itemTable', group: 'Extra item columns', label: 'Warehouse', parked: 'there is no warehouse master to choose from, so the column would be a text box nobody can fill correctly' },
  { kind: 'switch', id: 'colSalesman', zone: 'itemTable', group: 'Extra item columns', label: 'Salesman', parked: 'there is no salesman master to choose from' },

  {
    kind: 'choice', id: 'priceEditing', zone: 'itemTable', group: 'Price rules', label: 'Editing the price',
    options: [
      { value: 'free', label: 'Anyone can change it' },
      { value: 'rights', label: 'Only the owner can change it' },
      { value: 'locked', label: 'Locked', note: 'nobody changes it here' },
    ],
    parked: 'User rights are not built yet'
  },
  {
    kind: 'choice', id: 'minimumSalePrice', zone: 'itemTable', group: 'Price rules',
    label: 'Below the minimum sale price', options: YES_NO_BLOCK,
    parked: 'The item carries a minimum price and the grid does not check it yet',
  },
  {
    kind: 'choice', id: 'negativeStock', zone: 'itemTable', group: 'Price rules',
    label: 'Negative stock', options: YES_NO_BLOCK,
    parked: 'The grid does not check stock yet',
  },

  // ---- Tax ----
  {
    kind: 'choice', id: 'taxMode', zone: 'tax', label: 'Where is tax applied?',
    options: [
      { value: 'item', label: 'On each item line', note: 'every line carries its own rate' },
      { value: 'sundry', label: 'On bill sundry', note: 'one rate for the whole bill, as sundry rows' },
    ],
  },
  { kind: 'switch', id: 'pricesIncludeTax', zone: 'tax', label: 'Prices include tax' },
  {
    kind: 'switch', id: 'perInvoiceTax', zone: 'tax', label: 'Allow changing tax mode per invoice',
    parked: 'Tax mode is a default and earns no space on the invoice screen; a per-invoice override is not wired',
  },

  // ---- Sundries ----
  {
    kind: 'note', id: 'sundryNote', zone: 'sundries',
    label:
      'A charge picked from the master keeps the master’s type — Freight is an amount, Packing is a percentage — and only a charge invented on the spot offers the three. When prices include tax, each charge carries its own tax rate.',
  },

  // ---- Totals & saving ----
  // WHAT SAVE DOES IS NOT A SETTING ANY MORE. This offered four answers — Save, Save & Print,
  // Save & New, Save & Share — and was overturned on 25-08: Save has two tiers, "Save and new"
  // and "Save and go to the listing", with icon switches for WhatsApp, Print and Email that run
  // after the save if they are left on. That is a control on the screen, not a preference behind
  // one, and a person changes it per invoice rather than once.
  //
  // The row came out in the same change as the tail going in, deliberately. A setting that
  // answers a question the action bar also answers is the product carrying two answers on two
  // live screens, and whichever one somebody learns, the other is a lie.
  {
    kind: 'choice', id: 'roundOff', zone: 'totals', label: 'Round off',
    options: [
      { value: 'up', label: 'Auto — up to the next rupee' },
      { value: 'nearest', label: 'Auto — nearest rupee' },
      { value: 'manual', label: 'Manual amount' },
      { value: 'ask', label: 'Ask on save' },
      { value: 'off', label: 'Off — exact paise' },
    ],
  },
  {
    kind: 'note', id: 'columnsLiveOnTheTable', zone: 'totals',
    label:
      'Columns are set from the table itself — right-click any heading, or use the control in its top-right corner. Density is in the top bar, because it applies to every screen rather than to invoices.',
  },
]
