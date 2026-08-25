// The box every header field sits in.
//
// ITS OWN FILE BECAUSE TWO FILES NEED IT AND ONE OF THEM WAS REACHING BACK INTO THE OTHER. It was
// in HeaderFields, and when the Due field moved out it imported this from there — a cycle, which
// the dependency gate caught. A box four fields share belongs to none of them.

import type * as React from 'react'

/** The box every header field sits in: one label, one line for the field, one for what is in
 * effect. Written once because four fields with three different gaps read as four accidents. */
export function MetaField({ width, children }: { width: string; children: React.ReactNode }) {
  // RELATIVE, because the label is positioned ON the field's border rather than stacked above
  // it. See FieldSettings.
  return <div className={`relative flex shrink-0 flex-col ${width}`}>{children}</div>
}
