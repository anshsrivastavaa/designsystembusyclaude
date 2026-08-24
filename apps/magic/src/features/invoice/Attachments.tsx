// THE PAPERCLIP AND WHAT IS BEHIND IT. A photo of the rough invoice, a purchase order, the rate
// contract — invoice-level, never row-level.
//
// v2 PUT THIS IN THREE PLACES BEFORE IT SETTLED: a popover beside the star and the gear, then a
// card under the sundry panel on 07-08, then back to the header paperclip on 10-08 with the
// card retired. This is the 10-08 shape, kept — the argument was had and it landed on the
// header, where a thing that belongs to the whole voucher belongs.
//
// THE HEADING SAYS "ATTACHMENTS", WHERE v2's SAYS "ATTACH". Changed, and the reason is inside
// the panel: the button at its foot already says "Attach a file", so a panel titled with the
// same verb reads as a command that does nothing. The panel is the list; the button is the act.
//
// THE COUNT IS ON THE BUTTON, which the product document asks for, and it is the only thing on
// this screen that says an invoice HAS attachments without opening anything. A paperclip alone
// looks identical whether the invoice carries eight files or none.
//
// THE PICKER IS THE REAL ONE. v2 mocks it with a canned list of eight filenames, which was
// right for a prototype that had to demonstrate a refusal on demand. Here the rule is the thing
// being built, and a rule tested against a canned list is not tested at all — so this is a real
// <input type="file" multiple> and the journey drives it with real files off the disk.

import { useRef, useState } from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { data } from '../../data/source'
import { isRefusal } from '../../data/schema/refusal'
import { ATTACHMENT_KINDS, refusalSummary, sortFiles } from '../../lib/attachments'
import { AttachedFile } from './AttachedFile'
import { useInvoice } from './store'

// WHAT THE FILE DIALOG OFFERS, BUILT FROM THE ONE LIST. Typed out separately it would be a
// second copy of the rule that drifts from the first — and the drift shows up as a file the
// dialog would not even let you choose, with no message, because the refusal never runs.
//
// IT IS A HINT AND NOT THE RULE. Every file dialog has an "All files" escape, so a .zip still
// arrives here and is still refused by name. This only saves the person the trip.
const OFFERS = Object.values(ATTACHMENT_KINDS)
  .flat()
  .map((extension) => `.${extension}`)
  .join(',')

export function Attachments() {
  const button = useRef<HTMLButtonElement>(null)
  const picker = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [refused, setRefused] = useState<string | null>(null)
  const attachments = useInvoice((state) => state.attachments)
  const addAttachment = useInvoice((state) => state.addAttachment)
  const removeAttachment = useInvoice((state) => state.removeAttachment)

  async function take(chosen: FileList | null) {
    if (chosen === null) return
    const { taking, refused: turnedAway } = sortFiles([...chosen])
    setRefused(refusalSummary(turnedAway))
    // ONE AT A TIME AND IN ORDER, because the adapter is what decides the id and the order the
    // records come back in is the order they go on the list.
    for (const file of taking) {
      const answer = await data.attachFile(file.name, file.size)
      if (isRefusal(answer)) {
        setRefused(answer.message)
        continue
      }
      addAttachment(answer, file)
    }
  }

  const count = attachments.length

  return (
    <>
      <Button
        ref={button}
        size="icon-sm"
        variant="ghost"
        aria-haspopup="dialog"
        aria-expanded={open}
        // THE COUNT IS IN THE NAME, not only in the digit beside the clip. A screen reader
        // reading "Attachments" over an invoice carrying six files has said nothing useful.
        aria-label={count === 0 ? 'Attachments' : `Attachments — ${count}`}
        title={count === 0 ? 'Attachments' : `Attachments — ${count}`}
        onClick={() => setOpen((was) => !was)}
        className="gap-1 text-ink-muted"
      >
        <Icon name="attach" />
        {/* A DIGIT, NOT A DOT. A dot says "something is here" and a person then has to open the
            panel to find out how much; the number is the same pixels and answers the question. */}
        {count === 0 ? null : <span className="text-sm font-label text-ink-secondary">{count}</span>}
      </Button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Attachments" align="end">
        {/* WIDE ENOUGH FOR THE WHOLE SECOND LINE. At w-80 a row's facts ran off the end
            mid-date — "Photo · 2.0 MB · Aj Sharma · 24-08-…" — and a truncated date is a fact
            the row claims to carry and does not. */}
        <div className="flex w-96 flex-col p-2">
          <h2 className="px-2 pb-1 text-body font-strong text-ink">Attachments</h2>

          {/* NO EMPTY-STATE SENTENCE. An empty panel with one button on it says what to do by
              being an empty panel with one button on it. */}
          <div className="flex flex-col gap-1">
            {attachments.map((file) => (
              <AttachedFile
                key={file.id}
                file={file}
                onRemove={() => {
                  removeAttachment(file.id)
                  setRefused(null)
                }}
              />
            ))}
          </div>

          {/* ONLY WHEN SOMETHING WAS TURNED AWAY. A tinted container, which is what a refusal is
              in this product — red ink on the panel's own white is the alarm colour used as ink.
              It wraps rather than stretching the panel: v2's grew to nearly 500 wide on a long message and
              went off the right of the window, and this one has a fixed width so it cannot. */}
          {refused === null ? null : (
            <div className="mt-2 flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2">
              <p role="alert" className="min-w-0 flex-1 text-sm text-danger">
                {refused}
              </p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setRefused(null)}
                className="shrink-0 text-danger pressable focus-ring"
              >
                <Icon name="close" className="size-icon-sm" />
              </button>
            </div>
          )}

          <input
            ref={picker}
            type="file"
            multiple
            accept={OFFERS}
            className="sr-only"
            aria-hidden="true"
            tabIndex={-1}
            onChange={(event) => {
              void take(event.target.files)
              // THE SAME FILE HAS TO BE CHOOSABLE TWICE. Without this the input keeps its
              // value, so picking the file that was just removed fires no change event at all
              // and nothing happens — with no message, which is the worst kind of nothing.
              event.target.value = ''
            }}
          />

          <Button
            variant="outline"
            className="mt-2 w-full border-dashed"
            onClick={() => picker.current?.click()}
          >
            <Icon name="plus" className="size-icon-sm" />
            Attach a file
          </Button>
        </div>
      </Popover>
    </>
  )
}
