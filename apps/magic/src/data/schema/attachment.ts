import { z } from 'zod'

/** A file hanging off an invoice — a photo of the rough invoice, a purchase order, a rate
 * contract. Invoice-level, never row-level: what it evidences is the deal, not a line of it.
 *
 * WHO AND WHEN ARE THE BACKEND'S ANSWER, WHICH IS WHY THEY ARE ON THE RECORD RATHER THAN WORKED
 * OUT WHERE IT IS SHOWN. A browser's clock is whatever the machine is set to, and a browser
 * cannot know who is signed in — so a front end that stamped these would be writing two facts
 * it has no standing to write, onto a record that later gets audited.
 *
 * WHAT IS NOT HERE: the file's contents. The screen holds the record and the picked `File` side
 * by side while the invoice is open, and hands the bytes over at save. Putting a base64 blob in
 * the store would put two thousand invoice rows and a 10 MB scan in the same object. */
export const attachmentSchema = z.object({
  id: z.string().min(1),
  /** The file's own name, as chosen. It is what the row shows, what the remove question asks
   * about, and what the audit trail records — see docs/backend-assumptions.md. */
  name: z.string().min(1),
  /** Photo, PDF, Word, Spreadsheet. In a person's words, never a MIME type. */
  kind: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  /** The person, named. Not a user id: this is shown on a row and read by a human. */
  attachedBy: z.string().min(1),
  /** ISO instant. A date alone is not enough — two scans attached on the same day need an
   * order, and the audit trail keeps time. */
  attachedAt: z.string().min(1),
})

export type Attachment = z.infer<typeof attachmentSchema>
