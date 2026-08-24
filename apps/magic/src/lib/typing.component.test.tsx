// In the browser tier rather than the logic one, because the question is about real elements.
// `isTyping` asks what an EventTarget is, and the logic tier runs in node with no DOM at all —
// so `document.createElement` throws there and the test would be asserting against a stub of
// the thing it is meant to be checking.

import { describe, expect, it } from 'vitest'

import { isTyping } from './typing'

describe('whether the keyboard is in something being typed into', () => {
  it('counts the three things that take a keystroke for themselves', () => {
    // Two screens each answered this with two of the three, so a global shortcut fired into a
    // textarea on one screen and into a select on the other.
    expect(isTyping(document.createElement('input'))).toBe(true)
    expect(isTyping(document.createElement('textarea'))).toBe(true)
    expect(isTyping(document.createElement('select'))).toBe(true)
  })

  it('counts something editable in place, which is not an input at all', () => {
    const note = document.createElement('div')
    note.contentEditable = 'true'
    document.body.appendChild(note)
    expect(isTyping(note)).toBe(true)
    note.remove()
  })

  it('leaves everything else to the screen', () => {
    expect(isTyping(document.createElement('button'))).toBe(false)
    expect(isTyping(document.createElement('div'))).toBe(false)
    expect(isTyping(null)).toBe(false)
  })
})
