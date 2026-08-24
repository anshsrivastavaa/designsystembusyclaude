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
 * Accepts 21-08-2026, 21/08/2026 and 21.08.2026, because a number pad has a full stop on it
 * and a person typing at speed uses whichever separator is under their finger. */
export function dayFromText(typed: string): string | null {
  const parts = typed.trim().split(/[-/.]/)
  if (parts.length !== 3) return null
  const [date, month, year] = parts.map((part) => Number(part))
  if (date === undefined || month === undefined || year === undefined) return null
  if (!Number.isInteger(date) || !Number.isInteger(month) || !Number.isInteger(year)) return null
  if (month < 1 || month > 12 || date < 1 || date > 31 || year < 1000) return null
  const day = `${year}-${pad(month)}-${pad(date)}`
  // A DAY THAT DOES NOT EXIST IS NOT A DAY. 31-02 passes every range check above and the
  // browser silently turns it into the 3rd of March, which is a date nobody typed.
  const at = new Date(`${day}T00:00:00Z`)
  return at.getUTCDate() === date && at.getUTCMonth() + 1 === month ? day : null
}
