// Every utility we authored survives being merged with a class from another family.
//
// tailwind-merge works out which property a class sets FROM ITS NAME, and our hand-authored
// utilities are names it has never seen. It reads `text-caps` as a text colour, decides it
// conflicts with `text-ink-secondary`, and drops it — silently, because the class is typed in
// the source and does build, so every existing gate is satisfied while the size never reaches
// the element. A brand-new key cap rendered at body size instead of caps size, and that is how
// this was found.
//
// The names are literal here rather than read from the token file, because this tier has no
// @types/node and reading a file needs it. What stops the list going stale is the other half:
// a gate in the token group fails the build when a utility authored in utilities.css is missing
// from cn.ts. Behaviour is tested here; completeness is checked there.

import { describe, expect, it } from 'vitest'

import { cn } from './cn'

const SIZES = ['text-caps', 'text-sm', 'text-body', 'text-lg', 'text-heading', 'text-title']
const ICONS = ['size-icon-xs', 'size-icon-sm', 'size-icon-md', 'size-icon-lg', 'size-icon-xl']
const BOXES = ['h-control', 'h-control-sm', 'h-control-lg', 'h-row', 'w-drawer']
const OTHERS = ['shadow-raised', 'shadow-popover', 'shadow-dialog', 'shadow-drawer',
  'duration-swift', 'duration-glide', 'duration-enter', 'duration-leave', 'bg-scrim']

describe('the authored utilities survive a merge', () => {
  it.each(SIZES)('keeps %s when a colour follows it', (size) => {
    expect(cn(size, 'text-ink-secondary').split(' ')).toContain(size)
  })

  it.each(ICONS)('keeps %s when a colour follows it', (icon) => {
    expect(cn(icon, 'text-ink-muted').split(' ')).toContain(icon)
  })

  it.each([...BOXES, ...OTHERS])('keeps %s when a colour follows it', (utility) => {
    expect(cn(utility, 'text-ink').split(' ')).toContain(utility)
  })
})

describe('and still lose to a later class that sets the same property', () => {
  it('lets a later authored size beat an earlier one', () => {
    expect(cn('text-caps', 'text-title')).toBe('text-title')
    expect(cn('text-title', 'text-body')).toBe('text-body')
  })

  it('lets a later height beat an earlier one', () => {
    expect(cn('h-control', 'h-row')).toBe('h-row')
  })

  it('lets a later shadow beat an earlier one', () => {
    expect(cn('shadow-raised', 'shadow-dialog')).toBe('shadow-dialog')
  })

  it('lets a later duration beat an earlier one', () => {
    expect(cn('duration-swift', 'duration-enter')).toBe('duration-enter')
  })

  // A duration and an animation are different properties, so a component may carry both.
  it('keeps a duration and an animation together', () => {
    expect(cn('motion-rise', 'duration-glide').split(' ')).toEqual(['motion-rise', 'duration-glide'])
  })
})
