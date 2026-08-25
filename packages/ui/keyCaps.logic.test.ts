import { describe, expect, it } from 'vitest'

import { capFor } from './keyCaps'

// BOTH KEYBOARDS, ASSERTED SEPARATELY. The platform is a parameter here so neither answer depends
// on the machine the suite happens to run on — a test that only ever sees one platform is a test
// that passes on a laptop and ships the other case broken.

describe('what a key is called on the keyboard in front of you', () => {
  it('Alt is Option on an Apple keyboard and Alt everywhere else', () => {
    expect(capFor('Alt', true)).toBe('Option')
    expect(capFor('Alt', false)).toBe('Alt')
  })

  it('a shortcut written as Option still reads correctly on a PC', () => {
    expect(capFor('Option', false)).toBe('Alt')
    expect(capFor('Option', true)).toBe('Option')
  })

  it('leaves alone every key that is the same word on both', () => {
    for (const key of ['F2', 'F10', 'Esc', 'Enter', 'Shift', 'Tab', '↵', 'N']) {
      expect(capFor(key, true)).toBe(key)
      expect(capFor(key, false)).toBe(key)
    }
  })

  it('does NOT turn Ctrl into Command, because they are two different keys', () => {
    // Renaming one to the other would print a hint that does not work: Ctrl fires ctrlKey and
    // Command fires metaKey, and nothing in this build binds metaKey.
    expect(capFor('Ctrl', true)).toBe('Ctrl')
    expect(capFor('Ctrl', false)).toBe('Ctrl')
  })
})
