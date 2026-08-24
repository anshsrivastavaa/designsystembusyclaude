import { gstinIsDead, type GstinStatus, type Party, type TrustGrade } from '../schema/party'

/** What the portal last said about each party's registration. Deliberately mixed so every state
 * of the badge can actually be seen — v2 had to add two parties late for exactly this reason:
 * nothing in its data carried a cancelled GSTIN, so that warning had never once rendered in
 * eighteen rounds. `suspended` is here for the same reason, from the day the enum learned it. */
function gstinFor(name: string, index: number): GstinStatus {
  if (name === 'Cash') return 'none'
  if (index === 5) return 'cancelled'
  if (index === 7) return 'suspended'
  if (index === 9) return 'inactive'
  return 'active'
}

/** What the party would grade on behaviour alone, before the registration is taken into account. */
const EARNED = ['A', 'B', 'C', 'A', 'C', 'B', 'C', 'C', 'A', 'B', 'C', 'C'] as const

/**
 * THE GRADE ARRIVES ALREADY CAPPED, BECAUSE THE BACKEND IS WHAT CAPS IT.
 *
 * A dead registration holds the grade at C whatever the behaviour says. The cap lives on the
 * GRADE and not only on the badge's mark because the grade travels to surfaces the mark never
 * reaches — the party master, the listing, reports. A report ranking parties by trust that puts
 * a cancelled registration above a slow payer is the same hole reopening somewhere there is no
 * room for a dot.
 *
 * This was ruled on 23-08 and written into three comments, and then not implemented: the grade
 * was passed straight through and only a `cappedBy` flag was set, so Gupta Steel Company billed
 * as a B with a cancelled GSTIN.
 */
function gradeWithCap(index: number): TrustGrade {
  const earned = EARNED[index]!
  return gstinIsDead(gstinFor('', index)) ? 'C' : earned
}

const NAMES: [string, string][] = [
  ['Cash', ''],
  ['Sharma Traders', 'Indore'],
  ['Sharma Hardware', 'Bhopal'],
  ['Shah Enterprises', 'Ahmedabad'],
  ['Shreeji Hardware', 'Surat'],
  ['Gupta Steel Company', 'Kanpur'],
  ['Balaji Distributors', 'Hyderabad'],
  ['New Bharat Agencies', 'Nagpur'],
  ['Krishna Sales Corporation', 'Rajkot'],
  ['Modern Building Supplies', 'Pune'],
  ['Anand Iron Stores', 'Ludhiana'],
  ['Verma & Sons', 'Jaipur'],
]

// Deterministic, and deliberately mixed: some owe us, one is settled, some are in credit.
// Two Sharmas on purpose — the case the city exists to answer.
export const parties: Party[] = NAMES.map(([name, city], index) => ({
  id: `party-${index}`,
  name: name!,
  city: city!,
  mobile: name === 'Cash' ? '' : String(90000_00000 + index * 11117),
  gstin: name === 'Cash' ? '' : `2${index}AABCU${9603}R1Z${index % 10}`,
  outstandingPaise: index % 5 === 3 ? 0 : (index % 4 === 1 ? -1 : 1) * (index * 372900 + 45000),

  // Deliberately mixed, so every state of the badge can actually be seen. v2 had to add two
  // parties late for exactly this reason: nothing in its data carried a cancelled GSTIN, so
  // that warning had never once rendered in eighteen rounds.
  // A, B or C since 23-08, with the cap applied: a cancelled, suspended or inactive GSTIN
  // holds the grade at C whatever the rest says. `partyInsights` names the cap so the panel can
  // explain it without recomputing anything.
  trustGrade: name === 'Cash' ? null : gradeWithCap(index),
  creditLimitPaise: name === 'Cash' || index % 6 === 4 ? 0 : (index + 1) * 500000,
  // Cash pays now, so it has no terms at all. The rest carry the terms a wholesale ledger
  // actually has — a fortnight, a month, two months — rather than one number everywhere, because
  // the due-date picker has to show that they differ party to party.
  creditDays: name === 'Cash' ? 0 : [0, 30, 15, 45, 30, 60, 30, 15, 30, 45, 30, 60][index]!,
  overduePaise: index % 4 === 2 ? index * 120000 + 30000 : 0,
  gstinStatus: gstinFor(name, index),
}))

// The parties this user billed last. Cash sits here because it genuinely is recent, not
// because it is pinned — it scrolls away like any other party the moment it stops being one.
export const recentPartyIds = ['party-3', 'party-0', 'party-6']
