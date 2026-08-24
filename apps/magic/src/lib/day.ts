// What day it is, and how a day is written on this screen.
//
// ONE ANSWER TO "WHAT IS TODAY". The listing worked it out for its date filter and the invoice
// header needs the same answer for a new invoice's date, and two of them would be two chances
// to get the timezone wrong — which the listing already got wrong once, and wrote up.
//
// TODAY IS THE CALENDAR ON THE WALL, NOT GREENWICH. `new Date().toISOString().slice(0, 10)`
// turns the local moment into UTC before slicing the date off it, so in India, five and a half
// hours ahead, EVERY MOMENT BETWEEN MIDNIGHT AND HALF PAST FIVE REPORTS YESTERDAY. Opening the
// books at six in the morning is ordinary in a billing office, and an invoice would carry the
// wrong date with nothing on the screen to say so.

const pad = (part: number) => String(part).padStart(2, '0')

/** Today, as the calendar on the wall says it. ISO, because that is how a day is STORED. */
export function today(): string {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** A stored day as a person here writes it: 21-08-2026.
 *
 * DAY FIRST, and never the browser's locale. `toLocaleDateString` gives whatever the machine
 * is set to, so the same invoice reads 08/21/2026 on a laptop bought abroad — and 08-09 is a
 * different day in the two orders with nothing to say which one you are looking at. */
export function dayText(day: string): string {
  const [year, month, date] = day.split('-')
  if (year === undefined || month === undefined || date === undefined) return ''
  return `${date}-${month}-${year}`
}

/** What somebody typed into a date field, back to a stored day — or null if it is not one yet.
 *
 * SHORT ENTRY, BECAUSE MOST INVOICES ARE DATED TODAY OR THEREABOUTS. In `dd-mm-yyyy`: `27` is
 * day 27 of the month you are already in, `2707` is 27 July of the year you are already in, and
 * `270726` is 27 July 2026. Anything missing is taken from `reference`, which is the date the
 * field currently holds rather than today — so correcting the day of a back-dated invoice does
 * not silently drag it into this month.
 *
 * ODD LENGTHS ARE REFUSED RATHER THAN GUESSED AT. Three digits could be `d-mm` or `dd-m` and
 * five could be two different things; a field that guesses wrong on a date is worse than one
 * that waits. This is v2's behaviour and the reason it gives is the right one.
 *
 * Separators stay as they were: `-`, `/` and `.` are all accepted, because a number pad has a
 * full stop on it and a person typing at speed uses whichever is under their finger. The year
 * may be left off entirely. What comes BACK out is always hyphens — see `dayText`.
 */
export function dayFromText(typed: string, reference: string = today()): string | null {
  const text = typed.trim()
  if (text === '') return null

  const [refYear, refMonth] = reference.split('-').map((part) => Number(part))
  let date: number
  let month = refMonth ?? 1
  let year = refYear ?? 1970

  if (/^[0-9]+$/.test(text)) {
    if (text.length <= 2) {
      date = Number(text)
    } else if (text.length === 4) {
      date = Number(text.slice(0, 2))
      month = Number(text.slice(2, 4))
    } else if (text.length === 6) {
      date = Number(text.slice(0, 2))
      month = Number(text.slice(2, 4))
      year = 2000 + Number(text.slice(4, 6))
    } else if (text.length === 8) {
      date = Number(text.slice(0, 2))
      month = Number(text.slice(2, 4))
      year = Number(text.slice(4, 8))
    } else {
      return null
    }
  } else {
    // THE YEAR MAY BE LEFT OFF HERE TOO. This file used to refuse `21-08`, and that was overturned
    // on 24-08 for inconsistency rather than taste: `2707` two lines up already infers the year,
    // so refusing `27-08` for the same omission contradicts the rule immediately beside it. A
    // separator does not change what is ambiguous, and a day and a month are not.
    const parts = text.split(/[-/.]/)
    if (parts.length < 2 || parts.length > 3) return null
    const [typedDate, typedMonth, typedYear] = parts
    if (typedDate === undefined || typedMonth === undefined) return null
    date = Number(typedDate)
    month = Number(typedMonth)
    if (typedYear !== undefined) {
      if (typedYear.length !== 2 && typedYear.length !== 4) return null
      year = typedYear.length === 2 ? 2000 + Number(typedYear) : Number(typedYear)
    }
  }

  if (!Number.isInteger(date) || !Number.isInteger(month) || !Number.isInteger(year)) return null
  if (month < 1 || month > 12 || date < 1 || date > 31 || year < 1000) return null

  const day = `${year}-${pad(month)}-${pad(date)}`
  // A DAY THAT DOES NOT EXIST IS NOT A DAY. 31-02 passes every range check above and the
  // browser silently turns it into the 3rd of March, which is a date nobody typed.
  const at = new Date(`${day}T00:00:00Z`)
  return at.getUTCDate() === date && at.getUTCMonth() + 1 === month ? day : null
}

/** The same day so many days later, as a stored day. Negative goes backwards. */
export function daysAfter(day: string, days: number): string {
  const at = new Date(`${day}T00:00:00Z`)
  at.setUTCDate(at.getUTCDate() + days)
  return at.toISOString().slice(0, 10)
}

/** The first of the month a day falls in. */
export function monthStart(day: string): string {
  const [year, month] = day.split('-')
  return `${year}-${month}-01`
}

/** The month a panel is showing, written out: "August 2026". */
export function monthTitle(day: string): string {
  const [year, month] = day.split('-').map((part) => Number(part))
  return `${MONTHS[(month ?? 1) - 1]} ${year}`
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

/** The month `day` falls in, shifted by so many months, keeping the 1st. */
export function monthShifted(day: string, by: number): string {
  const [year, month] = day.split('-').map((part) => Number(part))
  const at = new Date(Date.UTC(year ?? 1970, (month ?? 1) - 1 + by, 1))
  return at.toISOString().slice(0, 10)
}

/**
 * EVERY CELL A MONTH GRID DRAWS, including the days either side that fill the first and last
 * weeks. Six rows of seven, always — a grid that changes height as you page through the year
 * moves everything under it, and the panel is anchored to a field.
 *
 * Weeks start on Sunday, which is what v2 draws and what the Indian working week reads as.
 */
export function monthGrid(day: string): { day: string; inMonth: boolean }[] {
  const first = monthStart(day)
  const leading = new Date(`${first}T00:00:00Z`).getUTCDay()
  const month = first.slice(0, 7)
  return Array.from({ length: 42 }, (_, at) => {
    const cell = daysAfter(first, at - leading)
    return { day: cell, inMonth: cell.slice(0, 7) === month }
  })
}
