// The files hanging off this invoice while it is open.
//
// A RECORD AND ITS BYTES, SIDE BY SIDE AND NOT IN THE SAME OBJECT. The record is the small,
// serialisable half — name, kind, size, who, when — and it is what the screen draws and what
// goes to the backend at save. The `File` itself is held beside it, keyed by the record's id,
// because a 10 MB scan inside a store that also holds two thousand invoice rows makes every
// keystroke in the grid copy it.
//
// A NEW INVOICE HAS NO ATTACHMENTS, AND THAT IS THE ONE PLACE THE DUPLICATE RULE LIVES TODAY.
// The product document says duplicating an invoice does not carry attachments over. Duplicate
// is not built — it is a NOT_BUILT row on the listing's kebab — so the rule cannot be written
// where it will eventually be enforced. What CAN be written, and is, is that starting an
// invoice clears them: whatever builds Duplicate starts from `reset`, and this is the test that
// notices if it ever stops. The other half of the rule is filed in docs/owed.md against the
// moment Duplicate is written.

import type { Attachment } from '../../data/schema/attachment'

export type Attaching = {
  attachments: readonly Attachment[]
  /** The bytes, by attachment id. Never rendered; handed over at save. */
  attachedFiles: Readonly<Record<string, File>>
  addAttachment: (attachment: Attachment, file: File) => void
  removeAttachment: (id: string) => void
}

type State = { attachments: readonly Attachment[]; attachedFiles: Readonly<Record<string, File>> }
type Apply = (change: Partial<State> | ((state: State) => Partial<State>)) => void

export function attaching(set: Apply): Attaching {
  return {
    attachments: [],
    attachedFiles: {},
    addAttachment: (attachment, file) =>
      set((state) => ({
        // NEWEST LAST. The list reads in the order things were attached, which is the order the
        // person did them in and the order the audit trail will show.
        attachments: [...state.attachments, attachment],
        attachedFiles: { ...state.attachedFiles, [attachment.id]: file },
      })),
    removeAttachment: (id) =>
      set((state) => {
        // The bytes go with the record. A file left behind here is a 10 MB leak that nothing
        // on the screen can ever show or remove again.
        const { [id]: gone, ...left } = state.attachedFiles
        void gone
        return { attachments: state.attachments.filter((one) => one.id !== id), attachedFiles: left }
      }),
  }
}
