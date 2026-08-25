import { describe, it, expect } from 'vitest'

import { actionFor, boundKeys } from './shortcuts'

describe('the shortcut table', () => {
  it('reads a plain key as its own action', () => {
    expect(actionFor({ key: 'Enter' })).toBe('complete-row')
    expect(actionFor({ key: 'ArrowRight' })).toBe('move-right')
  })

  it('tells Tab and Shift+Tab apart', () => {
    expect(actionFor({ key: 'Tab' })).toBe('next-field')
    expect(actionFor({ key: 'Tab', shiftKey: true })).toBe('previous-field')
  })

  it('takes Control or Command for the same shortcut, because both machines exist', () => {
    expect(actionFor({ key: 'End', ctrlKey: true })).toBe('last-filled-row')
    expect(actionFor({ key: 'End', metaKey: true })).toBe('last-filled-row')
  })

  it('does not fire a plain key when its shortcut wanted a modifier', () => {
    // SHIFT AND SPACE, because bare End stopped being the example on 25-08 — it means the end of
    // the row now, and the grid's only remaining modifier-only key is this one. The rule is
    // unchanged; what changed is which key can still demonstrate it. Space alone types a space
    // into the cell you are standing in, which is exactly why picking a line needs the Shift.
    expect(actionFor({ key: ' ', shiftKey: true })).toBe('select-record')
    expect(actionFor({ key: ' ' })).toBeNull()
  })

  it('tells the ends of a row from the ends of the grid', () => {
    // Bare and modified are different actions on the same key, which is the spreadsheet
    // convention: Home is the front of this row, Ctrl and Home is the top of the grid.
    expect(actionFor({ key: 'Home' })).toBe('row-start')
    expect(actionFor({ key: 'End' })).toBe('row-end')
    expect(actionFor({ key: 'Home', ctrlKey: true })).toBe('first-row')
    expect(actionFor({ key: 'End', metaKey: true })).toBe('last-filled-row')
  })

  it('does not fire a modified key when its shortcut wanted a plain one', () => {
    expect(actionFor({ key: 'Enter', ctrlKey: true })).toBeNull()
  })

  it('says nothing about a key nobody bound', () => {
    expect(actionFor({ key: 'F4' })).toBeNull()
  })

  it('reads F2 as creating the record in front of you', () => {
    expect(actionFor({ key: 'F2' })).toBe('create-record')
  })

  it('never binds one combination to two actions in the same place', () => {
    // WHERE is part of the combination now. Enter completes a row in the item grid and opens
    // a record in a listing, which is not a clash — the two can never both be true, because
    // the keyboard is only ever in one of them. Two bindings on Enter in the SAME place would
    // still be a clash, and that is what this counts.
    const seen = boundKeys.map((bound) => `${bound.where}/${bound.key}/${bound.command}/${bound.shift}`)
    expect(new Set(seen).size).toBe(seen.length)
  })

  it('reads the same key differently in the grid and in a listing', () => {
    expect(actionFor({ key: 'Enter' }, 'grid')).toBe('complete-row')
    expect(actionFor({ key: 'Enter' }, 'list')).toBe('open-record')
  })

  it('leaves the grid alone when a listing key is asked for, and the other way round', () => {
    expect(actionFor({ key: ' ' }, 'grid')).toBeNull()
    expect(actionFor({ key: 'Tab' }, 'list')).toBeNull()
  })

  it('defaults to the grid, so every binding written before `where` existed still means what it did', () => {
    expect(actionFor({ key: 'ArrowUp' })).toBe('move-up')
    expect(actionFor({ key: 'F2' })).toBe('create-record')
  })
})
