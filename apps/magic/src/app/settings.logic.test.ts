// Finding a setting, tested without a browser because none of it needs one.
//
// The behaviours that matter are the ones a naive version gets wrong: emptying the search must
// return you to the zone you chose rather than to everything, a second word must narrow rather
// than widen, and a person searching in their own words must find the thing they meant.

import { describe, expect, it } from 'vitest'

import { invoiceSettingsFrom } from '../lib/invoiceSettingsFrom'
import { SETTINGS, ZONES } from './settingsCatalogue'
import { groupsIn, visibleSettings, zonesWithSomething } from './settingsSearch'

const idsIn = (zone: Parameters<typeof visibleSettings>[0], query: string) =>
  visibleSettings(zone, query).map((setting) => setting.id)

describe('finding a setting', () => {
  /** Does changing this setting change what the invoice is given?
   *
   * IT TRIES THE SETTING'S OWN OPTIONS, not a made-up value. The first version flipped every
   * choice to the string 'off', which for the tax mode is neither of its two answers — so the
   * mapping saw no change and the test reported a working setting as dead. A probe that invents
   * a value is testing its own invention. */
  const reaches = (setting: (typeof SETTINGS)[number]) => {
    if (setting.kind === 'note') return false
    const base = { taxMode: 'item', pricesIncludeTax: false, roundOff: 'nearest' } as Record<string, string | boolean>
    const before = JSON.stringify(invoiceSettingsFrom(base, '23'))
    const tries =
      setting.kind === 'switch'
        ? [true, false]
        : setting.options.map((option) => option.value)
    return tries.some(
      (value) => JSON.stringify(invoiceSettingsFrom({ ...base, [setting.id]: value }, '23')) !== before,
    )
  }


  it('shows one zone when a zone is chosen and nothing is typed', () => {
    const shown = visibleSettings('tax', '')
    expect(shown.length).toBeGreaterThan(0)
    expect(shown.every((setting) => setting.zone === 'tax')).toBe(true)
  })

  it('searches across every zone, because being told nothing matches one tab away is the failure', () => {
    // Typed while sitting on Tax, and the answer is in Totals.
    expect(idsIn('all', 'round off')).toContain('roundOff')
  })

  it('returns to the chosen zone when the search is emptied, not to everything', () => {
    // The trick the whole arrangement rests on. Falling back to "show all" throws away the
    // section somebody picked and the list jumps to five times its length under their hands.
    const zoned = visibleSettings('tax', '')
    expect(visibleSettings('tax', '   ')).toEqual(zoned)
    expect(visibleSettings('tax', '').length).toBeLessThan(SETTINGS.length)
  })

  it('narrows on a second word rather than widening', () => {
    const one = idsIn('all', 'price')
    const two = idsIn('all', 'price minimum')
    expect(two.length).toBeLessThan(one.length)
    expect(two).toContain('minimumSalePrice')
  })

  it('finds rounding when somebody types paise, because people do not search in our words', () => {
    expect(idsIn('all', 'paise')).toEqual(['roundOff'])
  })

  it('finds the series when somebody types number', () => {
    expect(idsIn('all', 'number')).toContain('series')
  })

  it('finds a setting by the words inside its own options', () => {
    // "block" is not in any label — it is what one of the choices says it does.
    expect(idsIn('all', 'block')).toContain('negativeStock')
  })

  it('says nothing rather than everything when a search matches nothing', () => {
    expect(visibleSettings('all', 'xyzzy')).toEqual([])
  })

  it('reports only the zones that still have something in them', () => {
    const zones = zonesWithSomething(visibleSettings('all', 'paise'))
    expect([...zones]).toEqual(['totals'])
  })

  it('keeps the groups inside a zone in the order they are declared', () => {
    const groups = groupsIn(visibleSettings('itemTable', ''), 'itemTable').map(([name]) => name)
    expect(groups).toEqual(['', 'Extra item columns', 'Price rules'])
  })

  it('gives every setting a zone that exists, so none can be unreachable', () => {
    const known = new Set(ZONES.map((zone) => zone.id))
    expect(SETTINGS.filter((setting) => !known.has(setting.zone))).toEqual([])
  })

  it('leaves no setting both live-looking and dead', () => {
    // THE RULE THIS FILE EXISTS FOR. A switch that writes to the store and is read by nothing
    // is an enabled control that does nothing, in the one place nobody thinks to check. Nine
    // of these were exactly that for a day. Either the invoice reads it — which means
    // invoiceSettingsFrom maps it — or it wears a reason and is switched off.
    //
    const pretending = SETTINGS.filter(
      (setting) => setting.kind !== 'note' && setting.parked === undefined && !reaches(setting),
    ).map((setting) => setting.id)

    expect(pretending).toEqual([])
  })

  it('leaves no setting switched off that actually works', () => {
    // THE OTHER HALF, and it is just as much a lie. A control disabled with a reason, that
    // would have done something, tells the person the product cannot do a thing it can — and
    // it is invisible, because nobody presses a switch that is already off to check.
    //
    // This is not hypothetical: a scripted edit put `parked` on the tax mode by mistake, and
    // the first version of this test — which only looked for the live-and-dead case — passed
    // over it. A journey caught it instead, one file away.
    const wronglyParked = SETTINGS.filter(
      (setting) => setting.kind !== 'note' && setting.parked !== undefined && reaches(setting),
    ).map((setting) => setting.id)

    expect(wronglyParked).toEqual([])
  })

  it('gives every setting its own id, so none can shadow another in the store', () => {
    const ids = SETTINGS.map((setting) => setting.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
