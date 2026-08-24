// The mark beside a sorted column heading, at all three of its states.

import type { Meta, StoryObj } from '@storybook/react-vite'

import { TableSortMark } from './TableSortMark'

const meta = { title: 'TableSortMark' } satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const SortMarks: Story = {
  render: () => (
    <div className="max-w-xl space-y-6 bg-surface-page p-6">
      <div>
        <h1 className="text-title font-strong tracking-tight text-ink">TableSortMark</h1>
        <p className="mt-1 text-body leading-body text-ink-secondary">
          The chevron only CONFIRMS which way. The state you read across a whole header row is
          the heading darkening, not a small mark you have to hunt for — which is why the
          unsorted mark is invisible until the heading is hovered or focused.
        </p>
      </div>

      <ul className="divide-y divide-stroke rounded-card border border-stroke bg-surface">
        {([
          ['Ascending', 'asc'],
          ['Descending', 'desc'],
          ['Not sorted — present, and invisible until the heading is hovered', undefined],
        ] as const).map(([label, direction]) => (
          <li key={label} className="group/sort flex items-center gap-3 px-4 py-3">
            <span className="flex w-6 justify-center">
              <TableSortMark direction={direction} />
            </span>
            <span className="text-body text-ink-secondary">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  ),
}
