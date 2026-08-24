import type { Locator, Page } from '@playwright/test'

// Finding a cell by the column it is IN, rather than by how many cells happen to sit to its
// left.
//
// WHY THIS EXISTS. Nine journeys broke in one commit when the item grid learned its optional
// columns: HSN and Discount are on by default, so every `.nth(4)` in the suite quietly meant a
// different column than it had the day it was written. A position is a proxy for a column, and
// this codebase's rule about proxies is the whole reason those nine were wrong rather than
// merely out of date.
//
// It reads the heading row for the index, which is the same list the grid draws from — so a
// journey asks for "Price" and gets Price whatever else is switched on.

export function itemGrid(page: Page): Locator {
  return page.getByRole('grid', { name: 'Invoice items' })
}

/** The cell in `row` under the column headed `heading`. Row 1 is the first item row: row 0 is
 * the heading row itself, exactly as the grid draws it. */
export async function cellUnder(page: Page, row: number, heading: string): Promise<Locator> {
  const grid = itemGrid(page)
  const headings = await grid.getByRole('columnheader').allTextContents()
  const at = headings.findIndex((text) => text.trim().toUpperCase() === heading.toUpperCase())
  if (at === -1) throw new Error(`No column headed "${heading}" — the grid is showing ${headings.join(', ')}`)
  return grid.getByRole('row').nth(row).getByRole('gridcell').nth(at)
}
