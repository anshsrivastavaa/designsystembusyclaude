// Who is using the application, and what that lets them see.
//
// ONE CONTROL, NOT TWO. v2 has a role segment AND a separate "Show Profits" toggle beside it,
// and in this build there is exactly one flag behind both — the invoice shows cost, profit and
// margin or it does not. Two controls answering to one flag is the same fault as two menus
// called Help: whichever one you move, the other is now reporting a state it is not in. So the
// role is the control and the line under it says what the role means.
//
// IT RELOADS, AND THAT IS HONEST RATHER THAN LAZY. The role rides in the address as `?owner`
// and the invoice reads it once when the application starts — so changing it has to restart the
// application or the switch would move while the screen behind it did not. What removes the
// reload is the role becoming a store the shell owns and the invoice reading it, which is a
// change to `features/invoice/store.ts` and belongs to the session that owns that file. The
// moment it goes: whenever that store next gains a reset, which it needs for its own reasons.

import { Tabs } from '@busy/ui/Tabs'

import { TopMenu } from './TopMenu'

type Role = 'owner' | 'operator'

const ROLES = [
  { value: 'owner' as const, label: 'Owner' },
  { value: 'operator' as const, label: 'Operator' },
]

/** The role the address asks for. Absent means operator, because the narrower view is the safe
 * default: a screen that shows cost to somebody who should not see it cannot be un-shown. */
function roleFor(search: string): Role {
  return new URLSearchParams(search).has('owner') ? 'owner' : 'operator'
}

/** The same address with the role changed, and every other switch left alone. */
function addressForRole(search: string, role: Role): string {
  const query = new URLSearchParams(search)
  if (role === 'owner') query.set('owner', '')
  else query.delete('owner')
  const written = query.toString()
  // `?owner=` with nothing after it is what URLSearchParams writes for a flag, and it reads
  // back the same. Trimming the trailing `=` keeps the address the shape a person would type.
  return written === '' ? '' : `?${written.replace(/owner=(?=&|$)/, 'owner')}`
}

export function UserMenu() {
  const role = roleFor(window.location.search)

  return (
    <TopMenu label="User">
      <div className="w-72 p-3">
        <p className="mb-2 text-sm font-label text-ink-muted">Role</p>
        <Tabs
          options={ROLES}
          value={role}
          onChange={(next) => {
            if (next === role) return
            window.location.search = addressForRole(window.location.search, next)
          }}
          label="Role"
        />
        <p className="mt-2 text-body text-ink-secondary">
          {role === 'owner'
            ? 'An owner sees cost, profit and margin on the invoice. An operator does not.'
            : 'Switch to Owner to see cost, profit and margin on the invoice.'}
        </p>
      </div>
    </TopMenu>
  )
}
