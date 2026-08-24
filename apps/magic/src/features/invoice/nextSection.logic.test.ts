import { describe, expect, it } from 'vitest'

import { SECTIONS, nextSection } from './nextSection'

describe('F2 walks the invoice', () => {
  it('goes party, items, charges, save', () => {
    expect(nextSection('party')).toBe('items')
    expect(nextSection('items')).toBe('sundry')
    expect(nextSection('sundry')).toBe('save')
  })

  it('has nowhere further than save, which is what makes the last press save', () => {
    expect(nextSection('save')).toBe('save')
  })

  it('walks every section it names, so a new one cannot be added and left unreachable', () => {
    const walked = new Set(['party'])
    let at: (typeof SECTIONS)[number] = 'party'
    for (let step = 0; step < SECTIONS.length; step += 1) {
      at = nextSection(at)
      walked.add(at)
    }
    expect(walked.size).toBe(SECTIONS.length)
  })
})
