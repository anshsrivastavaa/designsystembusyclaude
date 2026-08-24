// The status strip and the two compliance ticks.
//
// TWO DIFFERENT KINDS OF CONTROL, SIDE BY SIDE ON PURPOSE. The tabs are a radio group where
// something is always chosen — you are always looking at some status, even if it is All. The
// compliance ticks are independent and either, neither or both can be on. Drawing them the
// same way would say they behave the same way, so the ticks carry actual checkboxes.
//
// THEY DO NOT GET CHIPS IN THE ROW BELOW. The rule for this screen: a narrowing gets a chip
// only when its own control is hidden behind a menu. These two are visible and say their own
// state, so a chip would just repeat them — and the chips row would stop meaning "things you
// can clear from here".

import { Checkbox } from '@busy/ui/Checkbox'
import { Tabs, type TabOption } from '@busy/ui/Tabs'
import { COMPLIANCE_LABEL, onTab, type ComplianceId, type Tab } from './filtering'
import { STATUS_LABEL } from '../../lib/payment'
import { TAB_STATUSES } from './tabs'
import { useListing } from './store'
import type { Invoice } from '../../data/schema/invoice'

const COMPLIANCE: ComplianceId[] = ['eInvoice', 'eWayBill']

export function ListingToolbar({ narrowed }: { narrowed: Invoice[] }) {
  const tab = useListing((state) => state.tab)
  const today = useListing((state) => state.today)
  const compliance = useListing((state) => state.compliance)
  const setTab = useListing((state) => state.setTab)
  const toggleCompliance = useListing((state) => state.toggleCompliance)

  // Counted on the list AFTER everything else has narrowed it and BEFORE the tab itself, so
  // each number is "how many would be left if I pressed this" rather than how many exist.
  const options: TabOption<Tab>[] = [
    { value: 'all', label: 'All', count: narrowed.length },
    ...TAB_STATUSES.map((status) => ({
      value: status as Tab,
      label: STATUS_LABEL[status],
      count: onTab(narrowed, status, today).length,
    })),
  ]

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tabs options={options} value={tab} onChange={setTab} label="Invoice status" />

      <span className="h-6 w-px bg-stroke" />

      <div role="group" aria-label="Compliance" className="flex items-center gap-1 rounded-control bg-surface-sunken p-1">
        {COMPLIANCE.map((which) => {
          const on = compliance.includes(which)
          return (
            <label
              key={which}
              className={
                on
                  ? 'flex h-control-sm cursor-pointer items-center gap-2 rounded-control bg-surface px-3 text-body font-label text-ink shadow-raised'
                  : 'flex h-control-sm cursor-pointer items-center gap-2 rounded-control px-3 text-body text-ink-secondary hover:bg-surface-hover hover:text-ink'
              }
            >
              <Checkbox checked={on} onChange={() => toggleCompliance(which)} aria-label={COMPLIANCE_LABEL[which]} />
              {COMPLIANCE_LABEL[which]}
            </label>
          )
        })}
      </div>
    </div>
  )
}
