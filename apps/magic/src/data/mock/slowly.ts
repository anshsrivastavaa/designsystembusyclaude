// The deliberate slowness, in one place.
//
// Nothing in this product has ever taken time to load, so no loading, empty or failed state
// has ever been designed. A couple of hundred milliseconds is enough for all three to have
// to exist. It is one wrapper around the whole adapter rather than delays sprinkled through
// the code, so that removing it is one line and not a search.

import { instant } from './switches'

const PAUSE = 220

export function slowly<Adapter extends object>(adapter: Adapter): Adapter {
  return new Proxy(adapter, {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver)
      if (typeof value !== 'function') return value
      return async (...args: unknown[]) => {
        if (!instant()) await new Promise((settle) => setTimeout(settle, PAUSE))
        return (value as (...rest: unknown[]) => unknown).apply(target, args)
      }
    },
  })
}
