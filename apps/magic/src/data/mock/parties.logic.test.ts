import { describe, expect, test } from 'vitest'

import { gstinIsDead, partySchema } from '../schema/party'
import { parties } from './parties'

// THE CAP IS A RULING AND THIS IS WHERE IT LIVES. It was written into three comments on 23-08
// and implemented in none of them — the grade was passed straight through and only a `cappedBy`
// flag was set, so a party with a cancelled GSTIN billed as a B. A comment describing behaviour
// the code does not have is the failure this codebase's first rule is about, so the rule is a
// test name now.

describe('the sample parties', () => {
  test('every one of them is a party the schema accepts', () => {
    for (const party of parties) expect(() => partySchema.parse(party)).not.toThrow()
  })

  test('a dead GSTIN holds the trust grade at C, whatever the behaviour earned', () => {
    const dead = parties.filter((party) => gstinIsDead(party.gstinStatus))
    // If this is ever zero the test below passes by having nothing to check, which is the same
    // fault as a group that runs nothing and reports green.
    expect(dead.length).toBeGreaterThan(0)
    for (const party of dead) expect(party.trustGrade).toBe('C')
  })

  test('all three dead states are actually present, or the badge has states nobody has seen', () => {
    // v2 shipped eighteen rounds with a cancelled-GSTIN warning that had never once rendered,
    // because nothing in its data carried one. The fixture is what stops that happening again.
    const statuses = new Set(parties.map((party) => party.gstinStatus))
    expect(statuses).toContain('suspended')
    expect(statuses).toContain('cancelled')
    expect(statuses).toContain('inactive')
  })

  test('a living registration is left alone — the cap is not quietly grading everybody C', () => {
    const alive = parties.filter((party) => party.gstinStatus === 'active')
    expect(alive.some((party) => party.trustGrade !== 'C')).toBe(true)
  })
})
