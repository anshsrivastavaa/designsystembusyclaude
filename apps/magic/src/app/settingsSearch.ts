// Finding a setting: the zone tabs and the search box, and the rule that makes them one thing
// rather than two that fight.
//
// SEARCH LOOKS EVERYWHERE, A TAB LOOKS AT ONE ZONE, AND EMPTYING THE SEARCH RETURNS YOU TO THE
// TAB. That last part is the whole trick and it is easy to miss: an emptied search that falls
// back to "show everything" silently throws away the zone the person had chosen, so the list
// they were reading jumps to five times its length under their hands. v2 gets this right and
// it is the reason both controls can exist at once.
//
// A HEADING SURVIVES ONLY WHILE SOMETHING UNDER IT DOES. A section title with nothing beneath
// it is a promise the list does not keep, and in a filtered list there will be several.
//
// SYNONYMS, BECAUSE PEOPLE DO NOT SEARCH IN OUR WORDS. Somebody looking for rounding types
// "paise". Somebody looking for the series types "number". A search that only matches the
// label we happened to choose is a search that works for whoever wrote the labels.

import { SETTINGS, type Setting, type Zone } from './settingsCatalogue'

/** Everyday words, and the settings they should find. Keyed by what a person types. */
const SYNONYMS: Record<string, string[]> = {
  paise: ['roundOff'],
  rounding: ['roundOff'],
  decimal: ['roundOff'],
  number: ['series', 'duplicateNumber'],
  numbering: ['series', 'duplicateNumber'],
  voucher: ['series', 'duplicateNumber'],
  gst: ['taxMode', 'pricesIncludeTax', 'colHsn'],
  hsn: ['colHsn'],
  inclusive: ['pricesIncludeTax'],
  stock: ['negativeStock', 'showStock'],
  discount: ['itemDiscount', 'secondDiscount', 'conditionalDiscount'],
  column: ['colHsn', 'colMrp', 'colAlias', 'colFreeQty', 'colWarehouse', 'colSalesman', 'columnsLiveOnTheTable'],
  columns: ['colHsn', 'colMrp', 'colAlias', 'colFreeQty', 'colWarehouse', 'colSalesman', 'columnsLiveOnTheTable'],
  density: ['columnsLiveOnTheTable'],
  address: ['billShip'],
  credit: ['creditWarning'],
  price: ['priceEditing', 'minimumSalePrice', 'priceHistory', 'pricesIncludeTax'],
}

/** Everything a setting can be found by: its own words, and the words people use instead. */
function haystack(setting: Setting): string {
  const own = [setting.label, 'note' in setting ? setting.note : '', 'group' in setting ? setting.group : '']
  const options = setting.kind === 'choice' ? setting.options.flatMap((one) => [one.label, one.note ?? '']) : []
  return [...own, ...options].filter(Boolean).join(' ').toLowerCase()
}

function matches(setting: Setting, term: string): boolean {
  if (haystack(setting).includes(term)) return true
  return (SYNONYMS[term] ?? []).includes(setting.id)
}

/**
 * Which settings to show.
 *
 * A query beats the zone, because searching is asking about the whole drawer — being told
 * "nothing matches" when the thing is one tab away is the failure this avoids. With no query
 * the zone is back in charge, which is what makes clearing the box return you to where you were
 * rather than to everything.
 */
export function visibleSettings(zone: Zone | 'all', query: string): Setting[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean)

  if (terms.length === 0) {
    return zone === 'all' ? SETTINGS : SETTINGS.filter((setting) => setting.zone === zone)
  }

  // Every term has to be found, so a second word narrows rather than widens. Typing more and
  // getting more results is the behaviour nobody expects.
  return SETTINGS.filter((setting) => terms.every((term) => matches(setting, term)))
}

/** The zones that still have something in them, in their declared order. A tab for an empty
 * zone is a tab that lands you on nothing. */
export function zonesWithSomething(visible: Setting[]): Set<Zone> {
  return new Set(visible.map((setting) => setting.zone))
}

/** The groups inside one zone, in the order they appear, with the ungrouped ones first under an
 * empty name. Returned as pairs rather than an object so the order is the list's, not the
 * key order of a record. */
export function groupsIn(visible: Setting[], zone: Zone): [string, Setting[]][] {
  const order: string[] = []
  const bucket = new Map<string, Setting[]>()

  for (const setting of visible) {
    if (setting.zone !== zone) continue
    const group = setting.group ?? ''
    if (!bucket.has(group)) {
      bucket.set(group, [])
      order.push(group)
    }
    bucket.get(group)!.push(setting)
  }

  return order.map((group) => [group, bucket.get(group) ?? []])
}
