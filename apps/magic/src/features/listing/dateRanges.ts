// The eight periods the date button offers, each one able to say its own actual dates.
//
// THE DATES ARE SHOWN, NOT JUST THE NAME. "Current FY" means nothing to somebody who has just
// switched books, and "This quarter" means two different things to two people in the same
// room. Printing 01-04-2026 – 31-03-2027 under the name costs one line and removes the
// question entirely.
//
// The financial year runs April to March, which is India's, and it is the reason Current FY
// cannot be worked out from the calendar year alone.

export type RangeId =
  | 'today' | 'yesterday' | 'last7' | 'last30'
  | 'thisMonth' | 'thisQuarter' | 'currentFy' | 'allTime' | 'custom'

export type DateRange = { from: string | null; to: string | null }

const iso = (date: Date) => date.toISOString().slice(0, 10)

/** A date `days` before the given day, as ISO. Built through UTC so a machine in a timezone
 * behind India does not quietly report yesterday. */
function shift(day: string, days: number): string {
  const at = new Date(`${day}T00:00:00Z`)
  at.setUTCDate(at.getUTCDate() + days)
  return iso(at)
}

const parts = (day: string) => {
  const [year, month] = day.split('-').map(Number)
  return { year: year ?? 0, month: month ?? 1 }
}

/** The last day of a month, as ISO. Day 0 of the next month is the last day of this one. */
function endOfMonth(year: number, month: number): string {
  return iso(new Date(Date.UTC(year, month, 0)))
}

const pad = (value: number) => String(value).padStart(2, '0')

export function rangeFor(id: RangeId, today: string): DateRange {
  const { year, month } = parts(today)

  switch (id) {
    case 'today':
      return { from: today, to: today }
    case 'yesterday':
      return { from: shift(today, -1), to: shift(today, -1) }
    // Last 7 days INCLUDES today, so it is six days back plus today. Seven days back would be
    // eight days of invoices under a label that says seven.
    case 'last7':
      return { from: shift(today, -6), to: today }
    case 'last30':
      return { from: shift(today, -29), to: today }
    case 'thisMonth':
      return { from: `${year}-${pad(month)}-01`, to: endOfMonth(year, month) }
    case 'thisQuarter': {
      const first = Math.floor((month - 1) / 3) * 3 + 1
      return { from: `${year}-${pad(first)}-01`, to: endOfMonth(year, first + 2) }
    }
    case 'currentFy': {
      // April to March. Before April you are still in the year that started last April.
      const startYear = month >= 4 ? year : year - 1
      return { from: `${startYear}-04-01`, to: `${startYear + 1}-03-31` }
    }
    case 'allTime':
    case 'custom':
      return { from: null, to: null }
  }
}

export const RANGE_LABEL: Record<RangeId, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Last 7 days',
  last30: 'Last 30 days',
  thisMonth: 'This month',
  thisQuarter: 'This quarter',
  currentFy: 'Current FY',
  allTime: 'All time',
  custom: 'Custom range',
}

/** The order they are offered in: shortest first, so the common answers are at the top. */
export const RANGE_IDS: RangeId[] = [
  'today', 'yesterday', 'last7', 'last30', 'thisMonth', 'thisQuarter', 'currentFy', 'allTime',
]

const readable = (day: string) => day.split('-').reverse().join('-')

/** The actual dates a period covers, in the form printed under its name. */
export function rangeDates(id: RangeId, today: string): string {
  if (id === 'allTime') return 'Every invoice in the book'
  const { from, to } = rangeFor(id, today)
  if (from === null || to === null) return ''
  return from === to ? readable(from) : `${readable(from)} – ${readable(to)}`
}

export function withinRange(day: string, range: DateRange): boolean {
  if (range.from !== null && day < range.from) return false
  if (range.to !== null && day > range.to) return false
  return true
}
