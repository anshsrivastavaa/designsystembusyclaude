// Where the data comes from. THE ONLY FILE OUTSIDE data/mock THAT MAY IMPORT FROM IT, and a
// check fails any other that tries.
//
// That is the whole handover: delete data/mock, change the line below to a backend
// implementation of the same interface, and nothing else in the application moves. Everything
// pretend about today's data is inside that folder — the sample world, the deliberate
// slowness, the switches that make it refuse.

import type { DataAdapter } from './adapter'
import { mockAdapter } from './mock/adapter'
import { checked } from './checked'

// EVERY ANSWER IS CHECKED AGAINST ITS SCHEMA HERE, and this is the only place it can be.
//
// The schemas were written on the first day and, until 21-08, never ran: the one `.parse()` in
// the repository was the mock validating itself, which proves the mock is well-formed and says
// nothing about a backend. `docs/architecture.md` and `schema/item.ts` both claimed the
// schemas guard what arrives. They did not.
//
// It wraps the SEAM rather than each screen, because the seam is where a stranger's data
// becomes ours. A backend that sends a string where a number belongs now produces a refusal
// the screen already knows how to show, instead of NaN spreading down a column.
export const data: DataAdapter = checked(mockAdapter)
