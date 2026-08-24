// How the table is arranged rather than what is in it: grouping, line items, and the way
// through to column setup.
//
// SIZED FOR THE SCREEN, NOT FOR ITS CONTENTS — same as the filters popover. A menu beside a
// table of 34px rows cannot be built out of full-height controls without reading as a different
// product that happens to be open on top of this one.
//
// GROUPING AND LINE ITEMS CANNOT BOTH BE ON. Grouping puts invoices under headings; line items
// opens each invoice into the things on it. Both at once is a three-level tree nobody asked
// for and nobody can read. So turning grouping on switches line items off and says why on the
// switch itself, rather than letting somebody build a mess and wonder what they did.

import * as React from 'react'

import { Button } from '@busy/ui/Button'
import { Icon } from '@busy/ui/Icon'
import { Popover } from '@busy/ui/Popover'
import { Toggle } from '@busy/ui/Toggle'
import { ColumnSetup } from './ColumnSetup'
import { MenuFooterAction, MenuHeading, MenuRow } from '@busy/ui/MenuRow'
import { GROUP_LABEL, useListing, type GroupBy } from './store'

const GROUPS: GroupBy[] = ['none', 'date', 'party', 'partyGroup', 'salesman']

/** Grouping needs a field to group by. Two of these read something no invoice carries, so they
 * are off and say what they are waiting for rather than producing one heading called
 * "undefined" with everything under it. */
const NEEDS: Partial<Record<GroupBy, string>> = {
  partyGroup: 'Needs a party group on the invoice',
  salesman: 'Needs a salesperson on the invoice',
}

export function TableViewMenu() {
  const groupBy = useListing((state) => state.groupBy)
  const lineItems = useListing((state) => state.lineItems)
  const setGroupBy = useListing((state) => state.setGroupBy)
  const setLineItems = useListing((state) => state.setLineItems)
  const button = React.useRef<HTMLButtonElement>(null)
  const [open, setOpen] = React.useState(false)
  const [columns, setColumns] = React.useState(false)

  const grouped = groupBy !== 'none'

  return (
    <>
      <Button ref={button} variant="ghost" aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen((was) => !was)}>
        <Icon name="rows" />
        Table view
        <Icon name="chevronDown" />
      </Button>

      <Popover open={open} onClose={() => setOpen(false)} anchorRef={button} label="Table view">
        <div className="w-64 py-1">
          <MenuHeading>Group by</MenuHeading>
          <div role="menu" aria-label="Group by">
            {GROUPS.map((group) => (
              <MenuRow
                key={group}
                chosen={group === groupBy}
                disabled={NEEDS[group] !== undefined}
                reason={NEEDS[group] ?? ''}
                detail={NEEDS[group] === undefined ? undefined : 'Not yet'}
                onClick={() => {
                  setGroupBy(group)
                  if (group !== 'none') setLineItems(false)
                }}
              >
                {GROUP_LABEL[group]}
              </MenuRow>
            ))}
          </div>

          <div className="border-t border-stroke px-3 py-2">
            <Toggle
              checked={lineItems}
              disabled={grouped}
              onCheckedChange={setLineItems}
            >
              Show line items
            </Toggle>
            <p className="mt-1 text-sm text-ink-muted">
              {grouped
                ? 'Turn grouping off to see line items — both at once is a tree nobody can read.'
                : 'Opens every invoice into the items on it.'}
            </p>
          </div>
        </div>

        <MenuFooterAction
          onClick={() => {
            setOpen(false)
            setColumns(true)
          }}
        >
          Column setup
        </MenuFooterAction>
      </Popover>

      <ColumnSetup open={columns} onClose={() => setColumns(false)} anchorRef={button} />
    </>
  )
}
