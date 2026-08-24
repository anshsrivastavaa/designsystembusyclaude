/**
 * The band that says what the rows under it have in common.
 *
 * A heading each time the answer changes, rather than a nested structure. Rows arrive already
 * in group order, so the change IS the boundary — and a flat table keeps the selection and the
 * totals working unchanged.
 *
 * IT IS NOT A ROW ANYBODY CAN LAND ON. It has no tab stop and it is not part of the keyboard
 * walk: arrowing down through a grouped table steps from the last invoice of one party to the
 * first of the next, past the band rather than onto it. That is why the row the cursor points
 * at is found by asking for it by number rather than by counting children of the table body —
 * with headings interleaved, the tenth child is not the tenth invoice.
 */
export function TableGroupHeading({ label, span }: { label: string; span: number }) {
  return (
    <tr className="h-row bg-surface-sunken">
      <th
        scope="colgroup"
        colSpan={span}
        className="border-y border-stroke px-3 text-left text-body font-strong text-ink"
      >
        {label}
      </th>
    </tr>
  )
}
