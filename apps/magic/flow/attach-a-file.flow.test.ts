import { expect, test } from '@playwright/test'

// Journey 26: attach a file to an invoice. A photo of the rough invoice, a purchase order, the
// rate contract — invoice-level, from the paperclip in the header.
//
// THE FILES ARE REAL AND THE CHOOSER IS REAL. The button is clicked the way a person clicks it
// and the file dialog it opens is caught, rather than the files being pushed into a hidden
// input directly — a control that never opened a chooser would pass that and be unreachable on
// the screen. v2 mocks this whole step with a canned list of eight filenames; here the rule is
// the thing being built, so the rule is given actual bytes to judge.

// NODE'S `Buffer`, NAMED HERE AND NOWHERE ELSE. The flow tests are node programs, but the
// TypeScript project that covers them also covers `packages/ui`, which is browser code — so
// pulling node's whole global set in would put `process` and `fs` within reach of a component.
// One symbol, with node's own signature, is the smaller thing to let in.
declare const Buffer: { alloc(size: number, fill: number): Uint8Array }

/** A file of a given size, made here rather than kept on disk. An 11 MB fixture committed to
 * prove one refusal is 11 MB carried by everybody who ever clones the repository. */
function file(name: string, bytes: number) {
  return { name, mimeType: 'application/octet-stream', buffer: Buffer.alloc(bytes, 1) }
}

async function offer(page: import('@playwright/test').Page, files: ReturnType<typeof file>[]) {
  const [chooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Attach a file' }).click(),
  ])
  await chooser.setFiles(files)
}

test('a file goes on, says what it is and who put it there, and the count reaches the paperclip', async ({ page }) => {
  await page.goto('/?screen=create')

  // NOTHING SAYS A COUNT UNTIL THERE IS ONE. A paperclip wearing a zero is a paperclip saying
  // something about an invoice that has nothing to say.
  const clip = page.getByRole('button', { name: 'Attachments' })
  await expect(clip).toBeVisible()

  await clip.click()
  const panel = page.getByRole('dialog', { name: 'Attachments' })
  await expect(panel).toBeVisible()

  await offer(page, [file('purchase-order.pdf', 340 * 1024)])

  // Name, kind, size, who and when — the product document asks for all five on the row.
  await expect(panel.getByText('purchase-order.pdf')).toBeVisible()
  const facts = panel.getByText(/PDF · 340 KB · /)
  await expect(facts).toBeVisible()
  // WHO AND WHEN COME FROM BEHIND THE SEAM. The browser cannot know either, so the name on the
  // row is the adapter's answer and the time is its clock.
  await expect(facts).toContainText('Aj Sharma')

  // The count is now on the paperclip, and it is in the name as well as on the screen.
  await expect(page.getByRole('button', { name: 'Attachments — 1' })).toBeVisible()
})

test('several at once attaches the ones it can and reports the rest, by name and by reason', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('button', { name: 'Attachments' }).click()
  const panel = page.getByRole('dialog', { name: 'Attachments' })

  await offer(page, [
    file('rough-invoice-photo.jpg', 2 * 1024 * 1024),
    file('backup-2026.zip', 12 * 1024),
    file('purchase-order.pdf', 340 * 1024),
    file('full-batch-scan.pdf', 11 * 1024 * 1024),
  ])

  // The two good ones went on. Refusing the whole selection because one file in it was wrong is
  // what makes people attach files one at a time forever.
  await expect(panel.getByText('rough-invoice-photo.jpg')).toBeVisible()
  await expect(panel.getByText('purchase-order.pdf')).toBeVisible()
  await expect(panel.getByText('backup-2026.zip')).toBeHidden()
  await expect(panel.getByText('full-batch-scan.pdf')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Attachments — 2' })).toBeVisible()

  // BOTH REASONS, NOT ONE. Told only about the type, somebody would go and convert the
  // oversized scan and watch it fail a second time.
  const alert = panel.getByRole('alert')
  await expect(alert).toHaveText('2 file(s) could not be attached. This file type is not allowed. File is larger than 10 MB.')

  // A TINTED CONTAINER, which is what a refusal is in this product — alarm ink on the panel's
  // own white is the alarm colour used as ink. Asked as the thing it means rather than as a
  // colour written down here: the ground under the message is not the ground under the list,
  // and the message's ink is not the list's ink. A token may move; the contrast may not.
  const paint = await panel.evaluate((surface) => {
    const message = surface.querySelector('[role="alert"]')
    const heading = surface.querySelector('h2')
    if (message === null || heading === null || message.parentElement === null) return null
    const seen = getComputedStyle(message)
    return {
      ink: seen.color,
      ground: getComputedStyle(message.parentElement).backgroundColor,
      plainInk: getComputedStyle(heading).color,
      panelGround: getComputedStyle(surface).backgroundColor,
    }
  })
  expect(paint).not.toBeNull()
  expect(paint?.ink).not.toBe(paint?.plainInk)
  expect(paint?.ground).not.toBe(paint?.panelGround)
  // AND IT IS ACTUALLY PAINTED. Two different strings is not enough on its own — a container
  // with no background at all reports a fully transparent colour, which reads as "different
  // from the panel" while showing the panel straight through.
  expect(paint?.ground).not.toMatch(/,\s*0\)$/)

  await panel.getByRole('button', { name: 'Dismiss' }).click()
  await expect(panel.getByRole('alert')).toBeHidden()
})

test('removing asks first, keeps by default, and takes the file off when told to', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('button', { name: 'Attachments' }).click()
  const panel = page.getByRole('dialog', { name: 'Attachments' })
  await offer(page, [file('rate-contract.docx', 88 * 1024)])

  await panel.getByRole('button', { name: 'Remove rate-contract.docx' }).click()

  // KEEP IS THE DEFAULT, and "default" means the keyboard is already on it — so the reflex
  // press of Enter over a question nobody read is the answer that cannot be undone.
  const keep = panel.getByRole('button', { name: 'Keep', exact: true })
  await expect(keep).toBeFocused()
  await expect(panel.getByText('Remove rate-contract.docx?')).toBeVisible()

  await page.keyboard.press('Enter')
  await expect(panel.getByText('rate-contract.docx')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Attachments — 1' })).toBeVisible()

  // Asked again and answered the other way, it goes — and the count goes back with it.
  await panel.getByRole('button', { name: 'Remove rate-contract.docx' }).click()
  await panel.getByRole('button', { name: 'Remove', exact: true }).click()
  await expect(panel.getByText('rate-contract.docx')).toBeHidden()
  await expect(page.getByRole('button', { name: 'Attachments', exact: true })).toBeVisible()
})

test('the picker is emptied after a pick, so the same file can be chosen a second time', async ({ page }) => {
  await page.goto('/?screen=create')
  await page.getByRole('button', { name: 'Attachments' }).click()
  const panel = page.getByRole('dialog', { name: 'Attachments' })

  await offer(page, [file('site-survey.tiff', 6 * 1024 * 1024)])
  await expect(page.getByRole('button', { name: 'Attachments — 1' })).toBeVisible()

  // THIS ASKS THE MECHANISM, NOT THE OUTCOME, AND THE REASON IS THAT THE OUTCOME CANNOT BE
  // ASKED HERE. One input serves every pick. A browser fires no change event when the same file
  // is chosen into an input that is still holding it, so removing a file and picking it again
  // did nothing at all, with no message — but the driver sets files straight onto the element
  // and always fires the event, so a journey that simply picks twice passes either way. It was
  // written that way first and stayed green with the fix taken out. What IS true of both the
  // driver and a person is that the input must be empty afterwards.
  const held = await panel.locator('input[type="file"]').inputValue()
  expect(held).toBe('')

  await offer(page, [file('site-survey.tiff', 6 * 1024 * 1024)])
  await expect(page.getByRole('button', { name: 'Attachments — 2' })).toBeVisible()
  await expect(panel.getByText('site-survey.tiff')).toHaveCount(2)
})
