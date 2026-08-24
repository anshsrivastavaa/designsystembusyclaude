// One file on the list, and the question asked before it goes.
//
// THE QUESTION REPLACES THE ROW RATHER THAN OPENING A SECOND SURFACE. A confirmation dialog on
// top of a popover is two floating things at once, and this build's rule is one — but the
// bigger reason is that a dialog takes the list away to ask about something on it. Asking in
// the row keeps the file name, the size and the date the person is deciding about in front of
// them while they decide.
//
// KEEP IS THE DEFAULT, which the product document asks for and which is right on its own terms:
// removing cannot be undone, so the safe answer is the one the keyboard is already on and the
// one Enter takes. Remove is the plain-looking control here and Keep is the solid one, which
// inverts the usual pairing on purpose — the emphasis follows the safe choice, not the verb the
// button was named after.
//
// TWO LINES, WHICH IS WHAT A LIST ROW IN THIS PRODUCT IS. The party list already carries a name
// on one line and the city and balance on the next, and this is the same kind of row: the thing
// on top, what is known about it underneath. It is not the subtext rule — that is about
// explaining a control, and none of this explains anything. It is the record.

import { useEffect, useRef, useState } from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import type { Attachment } from '../../data/schema/attachment'
import { sizeText } from '../../lib/attachments'
import { dayText } from '../../lib/day'

/** The day it went on, written the way every other date on this screen is written.
 *
 * THE DAY, NOT THE INSTANT. The record keeps the instant and the audit trail will want it; the
 * row has four other facts to carry and the clock time pushed the year off the end of the
 * line. Two files attached on one day are told apart by their order in the list, which is the
 * order they were attached in. */
function whenText(iso: string): string {
  const at = new Date(iso)
  if (Number.isNaN(at.getTime())) return ''
  return dayText(`${at.getFullYear()}-${String(at.getMonth() + 1).padStart(2, '0')}-${String(at.getDate()).padStart(2, '0')}`)
}

export function AttachedFile({ file, onRemove }: { file: Attachment; onRemove: () => void }) {
  const [asking, setAsking] = useState(false)
  const keep = useRef<HTMLButtonElement>(null)

  // THE KEYBOARD GOES TO THE SAFE ANSWER. Without this the question appears and the keyboard
  // stays on a bin button that is no longer on the screen, which drops it on the page body.
  useEffect(() => {
    if (asking) keep.current?.focus()
  }, [asking])

  if (asking) {
    return (
      <div role="group" aria-label={`Remove ${file.name}?`} className="rounded-control bg-surface-sunken px-2 py-2">
        <p className="text-body text-ink">Remove {file.name}?</p>
        <div className="mt-2 flex items-center gap-2">
          <Button ref={keep} size="sm" onClick={() => setAsking(false)}>
            Keep
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove} className="text-danger hover:bg-danger-soft">
            Remove
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-control px-2 py-2 hover:bg-surface-hover">
      <Icon name="attach" className="mt-0.5 size-icon-sm shrink-0 text-ink-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body text-ink">{file.name}</span>
        {/* WHAT IS KNOWN ABOUT IT, in the order somebody scanning the list needs it: what kind
            of thing it is, how big, then who put it there and when. */}
        <span className="block truncate text-sm text-ink-secondary">
          {file.kind} · {sizeText(file.bytes)} · {file.attachedBy} · {whenText(file.attachedAt)}
        </span>
      </span>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label={`Remove ${file.name}`}
        title={`Remove ${file.name}`}
        onClick={() => setAsking(true)}
        className="shrink-0 text-ink-muted hover:text-danger"
      >
        <Icon name="trash" className="size-icon-sm" />
      </Button>
    </div>
  )
}
