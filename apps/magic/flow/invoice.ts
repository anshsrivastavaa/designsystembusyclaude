import { expect, type Page } from '@playwright/test'

// OPENING AN INVOICE THAT ACTUALLY HAS ITS LINES ON IT.
//
// THE MOCK ANSWERS SLOWLY ON PURPOSE, so `?rows=N` draws the screen first and fills it a beat
// later. Every journey that presses a key at a loaded invoice can therefore press it at an
// EMPTY one — and an empty invoice answers most keys by correctly doing nothing, which reads
// exactly like the thing under test being broken. Journey 3 failed four times that way before
// anybody suspected the wait rather than the shortcut.
//
// A LINE IS NOT FOUND BY ITS TEXT. The cell holding the cursor holds a FIELD, and a field has
// no text content — so "wait until the first line is not empty" waits for ever, because the
// cursor opens on the first line's item cell. This asks for the field's VALUE as well, which is
// the one question that is true of a filled line wherever the cursor happens to be.
//
// IT GIVES UP LOUDLY. A wait that hangs silently until the whole test times out is the flake
// shape this build already lost a day to: the failure names the file it timed out in and
// nothing about what it wanted.

/** How long to wait for lines that should be arriving in well under a second. */
const PATIENCE = 5000

/** Opens an invoice and waits until it is holding `lines` lines. Returns once it is safe to
 * press a key at it. */
export async function openInvoice(page: Page, address: string, lines: number): Promise<void> {
  await page.goto(address)

  const filled = () =>
    page.evaluate(() => {
      const grid = document.querySelector('[role="grid"][aria-label="Invoice items"]')
      if (grid === null) return -1
      return [...grid.querySelectorAll('[role="row"][aria-rowindex]')].filter((row) => {
        if (row.getAttribute('aria-rowindex') === '1') return false
        const cell = row.querySelectorAll('[role="gridcell"]')[1]
        if (cell === undefined) return false
        // Text when the cursor is elsewhere, the field's value when the cursor is here.
        return (cell.textContent ?? '').trim() !== '' || (cell.querySelector('input')?.value ?? '') !== ''
      }).length
    })

  try {
    await expect.poll(filled, { timeout: PATIENCE }).toBeGreaterThanOrEqual(lines)
  } catch {
    const saw = await filled()
    throw new Error(
      `Waited ${PATIENCE}ms at ${address} for the invoice to hold ${lines} line(s) and it holds ${
        saw === -1 ? 'no item grid at all' : saw
      }. The mock fills the grid a beat after the screen draws; if this address is meant to open EMPTY, do not ask openInvoice for lines.`,
    )
  }
}
