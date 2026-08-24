// Every state a Drawer can be in. There is one Drawer in the product and every drawer is this
// component with a different body, so this page is where the shell is judged and the bodies
// are judged on their own screens.

import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { Drawer } from './Drawer'
import { TextField } from './TextField'

function Field({ label, value }: { label: string; value: string }) {
  return (
    <label className="block">
      <span className="text-sm text-ink-secondary">{label}</span>
      <span className="mt-1 block h-control rounded-control border border-stroke">
        <TextField defaultValue={value} aria-label={label} />
      </span>
    </label>
  )
}

function DrawerPage() {
  const [open, setOpen] = useState(false)
  const [long, setLong] = useState(false)

  return (
    <main className="min-h-screen bg-surface-page px-8 py-10 text-ink">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-title font-strong tracking-tight">Drawer</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-secondary">
          One component, a different body each time. Open it, press Escape, and click the wash
          behind it — all three close it, and the keyboard goes back where it came from rather
          than onto the page.
        </p>

        <div className="mt-8 flex gap-3">
          <Button onClick={() => setOpen(true)}>Open the drawer</Button>
          <Button variant="ghost" onClick={() => { setLong(true); setOpen(true) }}>
            Open one with more in it than fits
          </Button>
        </div>

        <Drawer
          open={open}
          onClose={() => { setOpen(false); setLong(false) }}
          title="Party details"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={() => setOpen(false)}>Save</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <Field label="Name" value="Sharma Traders" />
            <Field label="City" value="Indore" />
            <Field label="Mobile" value="9000011117" />
            {long
              ? Array.from({ length: 12 }, (_, at) => <Field key={at} label={`Extra field ${at}`} value="" />)
              : null}
          </div>
        </Drawer>
      </div>
    </main>
  )
}

const meta = { title: 'Drawer', render: () => <DrawerPage /> } satisfies Meta

export default meta

export const Drawer_: StoryObj<typeof meta> = { name: 'Drawer' }
