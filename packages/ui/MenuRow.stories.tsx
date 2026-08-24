import type { Meta, StoryObj } from '@storybook/react-vite'
import { DemoRow } from '../../.storybook/demo'
import * as React from 'react'

import { MenuFooterAction, MenuHeading, MenuRow } from './MenuRow'

const meta = {
  title: 'Library/MenuRow',
  component: MenuRow,
} satisfies Meta<typeof MenuRow>

export default meta

function Surface({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-72 rounded-control border border-stroke bg-surface-raised py-1 shadow-popover">{children}</div>
  )
}

export const Everything: StoryObj = {
  render: () => {
    const [period, setPeriod] = React.useState('year')
    return (
      <div className="min-h-screen bg-surface-page px-8 py-10 text-ink">
        <h1 className="text-title font-strong tracking-tight text-ink">MenuRow</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          One row inside a menu. A row is a choice or a command and says which — a command has
          nothing to tick, so it does not reserve the column a choice does.
        </p>

        <div className="mt-6 max-w-2xl rounded-card border border-stroke bg-surface p-4">
          <DemoRow label="Choices" align="top" note="The mark is reserved whether or not the row is chosen, so the labels do not shift sideways as the choice moves.">
            <Surface>
              <MenuHeading>Period</MenuHeading>
              {['year', 'quarter', 'month'].map((each) => (
                <MenuRow key={each} chosen={period === each} detail={each === 'year' ? '01-04 to 31-03' : undefined} onClick={() => setPeriod(each)}>
                  {each === 'year' ? 'Current FY' : each === 'quarter' ? 'This quarter' : 'This month'}
                </MenuRow>
              ))}
            </Surface>
          </DemoRow>

          <DemoRow label="Commands" align="top" note="No reserved column: a command is not one of a set.">
            <Surface>
              <MenuRow kind="command">Duplicate</MenuRow>
              <MenuRow kind="command">Print</MenuRow>
              <MenuRow kind="command" disabled reason="This invoice is cancelled">
                Record payment
              </MenuRow>
            </Surface>
          </DemoRow>

          <DemoRow label="Off, and why" align="top" note="A gap in the product carries the mark. A fact about the record — cancelled, nothing outstanding — does not.">
            <Surface>
              <MenuRow kind="command" notBuilt disabled reason="Not built yet">
                Send on WhatsApp
              </MenuRow>
              <MenuRow kind="command" disabled reason="Nothing is outstanding on this invoice">
                Record payment
              </MenuRow>
            </Surface>
          </DemoRow>

          <DemoRow label="A way out of the menu" align="top">
            <Surface>
              <MenuRow chosen>Table view</MenuRow>
              <MenuFooterAction onClick={() => {}}>Choose columns</MenuFooterAction>
            </Surface>
          </DemoRow>
        </div>
      </div>
    )
  },
}
