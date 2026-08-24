// The sundry master, as a real one looks: a handful of charges everybody uses, and the tax
// components the bill-wise mode generates rows from.
//
// Every entry is seeded taxable, which is the shape being right while every value is the
// same. Under GST a charge the supplier bills — freight, packing, insurance — is part of the
// taxable value, so taxable is the normal case. Whether any of these is ever NOT taxable is
// a question filed for stakeholders; the field is here so the answer has somewhere to land.

import type { SundryMaster } from '../schema/sundry'

export const sundryMaster: SundryMaster[] = [
  { id: 'sundry-freight', name: 'Freight', kind: 'flat', defaultValue: 50000, taxable: true, taxComponent: null },
  { id: 'sundry-packing', name: 'Packing charges', kind: 'percent', defaultValue: 2, taxable: true, taxComponent: null },
  { id: 'sundry-insurance', name: 'Insurance', kind: 'percent', defaultValue: 0.5, taxable: true, taxComponent: null },
  { id: 'sundry-loading', name: 'Loading charges', kind: 'perUnit', defaultValue: 500, taxable: true, taxComponent: null },
  { id: 'sundry-unloading', name: 'Unloading charges', kind: 'perUnit', defaultValue: 400, taxable: true, taxComponent: null },
  { id: 'sundry-handling', name: 'Handling charges', kind: 'flat', defaultValue: 15000, taxable: true, taxComponent: null },
  { id: 'sundry-discount', name: 'Trade discount', kind: 'percent', defaultValue: -5, taxable: true, taxComponent: null },

  // The tax components. An invoice in bill-wise mode generates its own rows from these — one
  // per component per rate band on the invoice — and item-level modes refuse them outright.
  { id: 'sundry-cgst', name: 'CGST', kind: 'percent', defaultValue: 0, taxable: false, taxComponent: 'cgst' },
  { id: 'sundry-sgst', name: 'SGST', kind: 'percent', defaultValue: 0, taxable: false, taxComponent: 'sgst' },
  { id: 'sundry-igst', name: 'IGST', kind: 'percent', defaultValue: 0, taxable: false, taxComponent: 'igst' },
  { id: 'sundry-cess', name: 'Cess', kind: 'percent', defaultValue: 0, taxable: false, taxComponent: 'cess' },
]

/** What each party had last time. Users add the same charges to the same party over and over,
 * which is why the picker offers these before it offers anything else. */
export const lastUsedByParty: Record<string, string[]> = {
  // Sharma Traders takes freight and packing every time — the case the sticky row exists for.
  'party-1': ['sundry-freight', 'sundry-packing'],
  // Cash has none, so the picker has to look right with nothing to offer.
  'party-0': [],
  'party-6': ['sundry-loading', 'sundry-unloading', 'sundry-freight'],
  'party-3': ['sundry-freight'],
}
