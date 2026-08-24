// What every setting is currently set to.
//
// A SETTING TAKES EFFECT THE MOMENT IT CHANGES, which is this codebase's existing ruling and
// the reason the drawer has no Save button — and therefore no Cancel either, because a Cancel
// promises an undo that does not exist. One Done, which only closes.
//
// Defaults live with the setting's own list rather than here, so a new setting is one entry in
// one file. Anything not answered is the first option of a choice, or off for a switch.

import { create } from 'zustand'

import { SETTINGS } from './settingsCatalogue'

/** The switches that start ON. Named here rather than as a flag on each setting, because a list
 * of six is readable and thirty `on: false` lines are not. */
const DEFAULT_ON = ['itemDiscount', 'showStock', 'partyBalance', 'creditWarning', 'colHsn']

type Values = Record<string, string | boolean>

/** The one thing the address bar may set, and it must be set HERE rather than in the adapter.
 *
 * Tax mode is read by the invoice AND shown in the drawer, so it has to have one source or the
 * two disagree — which they did the moment the drawer was wired: `?tax=inclusive` set the
 * adapter's answer, the drawer overwrote it a frame later, and the switch looked broken.
 * `?tax=inclusive` and `?tax=billwise`; anything else leaves the defaults alone. */
function asked(): Values {
  if (typeof window === 'undefined') return {}
  const wanted = new URLSearchParams(window.location.search).get('tax')
  if (wanted === 'billwise') return { taxMode: 'sundry' }
  if (wanted === 'inclusive') return { taxMode: 'item', pricesIncludeTax: true }
  return {}
}

const START: Values = Object.fromEntries(
  SETTINGS.flatMap((setting): [string, string | boolean][] => {
    if (setting.kind === 'note') return []
    if (setting.kind === 'switch') return [[setting.id, DEFAULT_ON.includes(setting.id)]]
    return [[setting.id, setting.options[0]?.value ?? '']]
  }),
)

export type SettingsState = {
  values: Values
  set: (id: string, value: string | boolean) => void
}

export const useSettings = create<SettingsState>((set) => ({
  values: { ...START, ...asked() },
  set: (id, value) => set((state) => ({ values: { ...state.values, [id]: value } })),
}))
