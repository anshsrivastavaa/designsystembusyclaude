// WHAT MAY BE ATTACHED TO AN INVOICE, AND WHAT TO SAY WHEN SOMETHING MAY NOT.
//
// THIS RULE BELONGS IN THE FRONT END, and that is worth saying out loud because most rules do
// not. A front end draws, and decides whether what a person handed it is well-formed. An
// extension and a byte count are exactly that, and they are decided here so the refusal arrives
// in the same instant as the file rather than after a round trip.
//
// WHAT IS NOT DECIDED HERE: who attached it and when. A browser's clock can be wrong and a
// browser cannot know who is signed in, so both come back from the adapter with the record.
//
// THE LIST AND THE SENTENCE ARE ONE THING. v2 learned this the hard way — a list of accepted
// extensions and a message naming them, maintained apart, disagreed with each other inside a
// single round. Here the message is built from the list, so it cannot say anything the list
// does not.

/** The kinds, in the words a person uses rather than in MIME types — a person attaching a scan
 * of a delivery note thinks "photo", not "image/heic". The kind is also what the row shows. */
export const ATTACHMENT_KINDS = {
  Photo: ['jpg', 'jpeg', 'png', 'heic', 'webp', 'tiff'],
  PDF: ['pdf'],
  Word: ['doc', 'docx'],
  Spreadsheet: ['xls', 'xlsx'],
} as const

export type AttachmentKind = keyof typeof ATTACHMENT_KINDS

/** Ten megabytes, per file rather than per invoice. Binary megabytes, because that is what the
 * file manager the person just came from showed them. */
export const LARGEST_BYTES = 10 * 1024 * 1024

/** The two refusals, in the product document's own words. They are short on purpose: an error
 * message that explains the whole policy is read by nobody at the moment it appears. */
export const NOT_ALLOWED = 'This file type is not allowed.'
export const TOO_LARGE = 'File is larger than 10 MB.'

/** The kind this file is, or null when it is one we do not take.
 *
 * READ OFF THE NAME, NOT OFF `File.type`. The browser fills `type` from the operating system's
 * own guess, and it comes back empty for HEIC on Windows and for anything the machine has no
 * handler for — so a perfectly ordinary photo would have been refused for being nothing. The
 * extension is what the person can see and is what they will argue with. */
export function kindOf(name: string): AttachmentKind | null {
  const found = /\.([a-z0-9]+)$/i.exec(name.trim())
  if (found === null) return null
  const extension = (found[1] ?? '').toLowerCase()
  for (const [kind, extensions] of Object.entries(ATTACHMENT_KINDS)) {
    if ((extensions as readonly string[]).includes(extension)) return kind as AttachmentKind
  }
  return null
}

/** A byte count the way a file manager writes it. Whole kilobytes and one decimal of a
 * megabyte, because "2.1 MB" is a size and "2,202,010 bytes" is a number. */
export function sizeText(bytes: number): string {
  if (bytes < 1024) return `${Math.max(0, Math.round(bytes))} B`
  const kilobytes = bytes / 1024
  if (kilobytes < 1024) return `${Math.round(kilobytes)} KB`
  return `${(kilobytes / 1024).toFixed(1)} MB`
}

/** Why this file cannot be attached, or null when it can.
 *
 * TYPE IS ASKED FIRST. A 40 MB executable is refused for being an executable, which is the
 * thing about it that will still be true after somebody compresses it. */
export function refusalFor(name: string, bytes: number): string | null {
  if (kindOf(name) === null) return NOT_ALLOWED
  if (bytes > LARGEST_BYTES) return TOO_LARGE
  return null
}

export type Sorted<File> = {
  taking: readonly File[]
  /** One line per refused file, in the order they were chosen. */
  refused: readonly { name: string; reason: string }[]
}

/** PICKING SEVERAL AT ONCE ATTACHES THE ONES IT CAN AND REPORTS THE REST. Refusing the whole
 * selection because one file in it was wrong is the behaviour that makes people attach files
 * one at a time forever. */
export function sortFiles<File extends { name: string; size: number }>(files: readonly File[]): Sorted<File> {
  const taking: File[] = []
  const refused: { name: string; reason: string }[] = []
  for (const file of files) {
    const reason = refusalFor(file.name, file.size)
    if (reason === null) taking.push(file)
    else refused.push({ name: file.name, reason })
  }
  return { taking, refused }
}

/** What to say about the ones that did not go on, in the product document's shape:
 * "<n> file(s) could not be attached. <Reason>."
 *
 * TWO FILES REFUSED FOR TWO DIFFERENT REASONS GET BOTH REASONS. The document's template has
 * one slot, which is right for the common case and silently wrong for the other one — a person
 * told only "This file type is not allowed" would go and convert the oversized scan and watch
 * it fail again. Repeats are dropped, so five bad types are still one sentence. */
export function refusalSummary(refused: Sorted<never>['refused']): string | null {
  if (refused.length === 0) return null
  const reasons = [...new Set(refused.map((one) => one.reason))]
  return `${refused.length} file(s) could not be attached. ${reasons.join(' ')}`
}
