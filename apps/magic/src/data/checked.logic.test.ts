import { describe, expect, it } from 'vitest'

import type { DataAdapter } from './adapter'
import { checked } from './checked'
import { mockAdapter } from './mock/adapter'
import { isRefusal } from './schema/refusal'

// The schemas were written on the first day and never ran until 21-08: the only .parse() in
// the repository was the mock validating itself, which proves the mock is well-formed and says
// nothing at all about a backend.

const brokenBy = (over: Partial<DataAdapter>): DataAdapter => checked({ ...mockAdapter, ...over })

describe('checking what the adapter answers', () => {
  it('passes a good answer through untouched', async () => {
    const answer = await checked(mockAdapter).listItems('Steel')
    expect(isRefusal(answer)).toBe(false)
    expect(Array.isArray(answer) && answer.length > 0).toBe(true)
  })

  it('refuses an answer of the wrong shape rather than letting it into a screen', async () => {
    const adapter = brokenBy({
      listItems: async () => [{ id: 'item-1', name: 'Steel rod' } as never],
    })
    const answer = await adapter.listItems('Steel')
    expect(isRefusal(answer)).toBe(true)
  })

  it('names what was wrong, and says the operator did not cause it', async () => {
    const adapter = brokenBy({
      getInvoice: async () => ({ ...(await mockAdapter.getInvoice('1')), totalPaise: 'lots' } as never),
    })
    const answer = await adapter.getInvoice('1')
    if (!isRefusal(answer)) throw new Error('expected a refusal')
    expect(answer.message).toContain('totalPaise')
    expect(answer.message).toContain('Nothing is wrong with what you typed')
  })

  it('leaves a refusal the adapter made alone, rather than checking it against a schema', async () => {
    const adapter = brokenBy({ listParties: async () => mockAdapter.listParties('nobody') })
    const answer = await adapter.listParties('nobody')
    expect(isRefusal(answer)).toBe(false)
  })
})
