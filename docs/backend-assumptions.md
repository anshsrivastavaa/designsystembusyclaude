# What this front end assumes about the backend

The handover document. Every assumption made about backend behaviour is written here as it is
made, so the dev team reads a list instead of hunting through components.

**Nothing in this file is a decision.** Each line is either something the backend must do, or
something the mock pretends so that a screen could be built. Where a line is wrong, the fix is
in one place and this file says which.

---

## The rule that keeps this file short

**Every unknown is a field on the data, never a branch in the code.** There is no
"when the backend exists" conditional anywhere in this application, and there is not going to
be one. If something cannot be expressed as a field, the requirement is not understood yet,
and that is worth discovering now rather than at integration.

**Everything pretend lives in `apps/magic/src/data/mock/`.** One file outside it —
`apps/magic/src/data/source.ts` — knows that folder exists, and a check fails any other that
imports from it. Delete the folder, point that one line at a real implementation of
`DataAdapter`, and the job is done.

---

## Who decides what

**We decide whether something is well-formed.** Is it a number. Is it filled in. Is the date
real. Does the arithmetic add up.

**They decide whether it is allowed.** Does this GSTIN exist. Is the party over its credit
limit. Is there stock to sell. Is this invoice number already used.

A refusal — "no, and here is why" — is a type that only the schema layer and the adapter can
construct. Components may show one and cannot invent one; TypeScript carries most of that and
a lint rule carries the rest. No invented business rule is waiting in a component for somebody
to find and delete.

---

## We invent the VALUES. We never invent the RULES. (Aj, 24-08)

**Every figure this product needs from a backend is invented in `data/mock/`, deliberately, and
the dev team stitches the real ledger behind the same shapes later.** Nothing waits for a real
number. If a screen needs what a party holds on account, or four kinds of credit, or a batch
number, or a pending order to pull lines from — invent it, seed it in `data/mock/`, and write
the shape down in this file. That is the whole method, and this file is the receipt.

**The line is between a value and a rule, and it is the same line the section above draws.**

- **Invent freely:** what the numbers ARE. Balances, credits, references, dates, statuses,
  histories, the contents of any list this front end displays.
- **Never invent:** how a number is WORKED OUT, or whether something is ALLOWED. Whether a party
  is over its limit, whether a GSTIN is live, whether an invoice number is taken, how a tax is
  apportioned. Those are the backend's answers, and a second answer computed here is the fault
  this file exists to prevent — the listing once recomputed tax by reducing over an invoice's
  rows while the header already carried it, and the fix was to delete the second calculation,
  not to make it agree.

Put another way: **a made-up number is a placeholder and costs nothing to replace. A made-up rule
is a second source of truth and costs an integration.**

**What this ruling unblocked.** Four journeys were parked on "linked documents" not existing —
pending vouchers, batches and serials, converting an order, and pulling several orders in.
`docs/journeys.md` says that one absence blocks more of that list than anything else. It does not
block anything now: the linked documents are invented like everything else, and their shapes come
here.

---

## Assumptions, as they were made

### Money

- Amounts cross the wire as **integers of the smallest unit** — 1250 is twelve rupees fifty.
  Nothing holds a rupee value as a decimal number anywhere.
- **Line amounts and totals are worked out in the front end for immediate feedback while
  someone is typing. The backend is authoritative on save.** What the screen shows during
  entry is a courtesy to the person typing; what comes back from `saveInvoice` is what is
  true. If the two disagree, the backend wins and the screen has to say so.
- **There are three tax modes, not two**, and the arithmetic for all three is in
  `lib/totals.ts`: `itemExclusive` adds tax per line, `itemInclusive` treats the line amount as
  already containing it and works backwards, and `billWise` generates tax rows per band at the
  foot of the bill. **Provisional** — the real specification arrives with region two, and this
  document said "two modes, per-line is right in one of them" while the code had shipped all
  three.

### Refusals

- `saveInvoice` can return a refusal instead of an invoice. The mock returns a canned one
  behind `?refuse` so the refusal state could be designed and looked at. **The wording and the
  code in it are placeholders.** The real set of reasons a save can be refused is theirs.
- Refusals carry a `field` so the screen can put the cursor on the thing to correct. If the
  backend cannot say which field a refusal is about, the screen can only show it beside the
  button, which is worse.

### Attachments

- **Whether a file MAY be attached is decided in the front end**, in `lib/attachments.ts`: the
  extension against a list of eleven, and the size against ten megabytes. That is deliberate and
  it is the exception rather than the rule here — a refusal has to arrive in the same instant as
  the file, not after a round trip. Everything else about an attachment is yours.
- **Who attached it and when are YOUR answers, and the front end never writes them.** They come
  back from `attachFile`, which is called once per accepted file. A browser's clock is whatever
  the machine is set to and a browser cannot know who is signed in, so a screen that stamped
  either would be writing two facts onto a record that later gets audited. The mock returns a
  fixed name and the laptop's clock; a real one must not.
- **The bytes do not travel through `attachFile`.** It takes a name and a size and gives back a
  record. The screen holds the picked file beside the record and hands it over at save. Where
  the bytes actually go — a direct upload, a signed URL, a multipart save — is yours, and
  nothing on the screen depends on which you choose.
- **The audit trail must record an attachment added or removed, with the file name.** The
  product document asks for it and this front end does not do it, on purpose: an audit trail is
  a record of what happened to a business document, and a client that kept its own would be
  writing business truth. There is no audit trail screen in this build either — it is a
  `NOT_BUILT` row on the listing's kebab.
- **`InvoiceDraft` carries `attachments`; `Invoice` does not yet.** A save sends them; what
  comes back has no attachments on it, so an invoice reopened from the listing cannot show the
  files it was saved with. That is the modify screen's to close and it is filed in
  `docs/owed.md`. When you add the field, the listing's Attachment column and its Attachment
  filter — both `NOT_BUILT` today — become buildable in the same move.
- **Duplicating an invoice does not carry attachments over.** Duplicate is not built here, so
  the rule lives where it can be enforced today: starting a new invoice clears them, and a test
  holds that.

### Items

- An item is searched by **name, alias and barcode** — three fields on the item, not three
  endpoints.
- Whether a unit can be chosen for an item is **a field on the item, not a rule in the
  screen**. Aj ruled on 20-08 that a new item offers all units and an existing item offers a
  choice only when it has an alternate or packaging unit enabled. That flag has to arrive on
  the item. Until it does, Unit stays a plain field.
- The item picker shows **stock**, and only on the highlighted row.

### Parties

- A party is searched by **name, mobile and GSTIN**. City is shown on every row and searched
  by none of them.
- `listRecentParties` returns the parties billed most recently, **in that order**, and the
  front end does not sort them. Cash appears there when it is genuinely recent; it is not
  pinned.
- A party's outstanding balance is a **signed integer**: positive is a receivable, negative is
  a payable. How that direction is DISPLAYED is still open — the convention in the code today
  is Dr/Cr with no sign, and brackets are the alternative.
- **The trust grade arrives ALREADY CAPPED, and the backend is the only thing that grades.**
  A GSTIN that is `suspended`, `cancelled` or `inactive` holds the grade at C whatever the
  behaviour earned. The cap is on the GRADE and not only on the badge's mark, because the grade
  travels to surfaces the mark never reaches — the party master, the listing, reports. A report
  ranking parties by trust that puts a cancelled registration above a slow payer is the same
  hole reopening somewhere there is no room for a mark.
  **The front end must never re-derive or re-cap it.** A second thing computing a grade computes
  it differently the day the weights change, and then one screen disagrees with another about
  the same party. What the front end does add is `cappedBy`, which names the criterion that held
  the grade — a held C and an earned C are the same letter, and the panel is where the
  difference gets explained.
- **`gstinStatus` has six values and the front end can represent all of them:** `active`,
  `suspended`, `cancelled`, `inactive`, `unchecked`, `none`. `suspended` is here because the GST
  portal really does return it and the product document names all four live states; a front end
  that cannot represent a status the backend will send is a bug waiting for integration day.
  `unchecked` is a real answer and the commonest one for a party created at the counter — it is
  NOT `active`, because claiming a registration is good on the strength of somebody typing
  fifteen characters is a claim about tax compliance nobody made.

### Invoices

- An invoice carries its own **header** — number, date, due date, party, total, amount
  received, cancelled-at — so a listing of two thousand reads only headers and never opens the
  rows.
- **The invoice header carries `taxablePaise` and `taxPaise`, and the backend computes them.**
  What the rows come to before tax, and the tax on them, are ON THE HEADER — because a listing
  reads the header and never opens the rows, and a listing of two thousand invoices must never
  fetch two thousand sets of rows to print a column.
  **They are not sent on a draft.** They are what the invoice is WORTH, which is the backend's
  answer, exactly like the number and the total. A draft carries what the operator typed.
  This exists because the listing was reducing over `rows` to get both while the schema promised
  it never opens them. The answer was not a guard on the second calculation — it was to delete
  the second calculation. A front end draws and checks that what was typed is well-formed; it
  does not own what an invoice is worth.
- **The party name is carried on the invoice as well as on the party.** A listing cannot fetch
  two thousand parties to print a name, and the name on an invoice is what it said when it was
  raised: renaming a party does not rewrite its history.
- **Payment state is not a field.** Nothing paid, part paid and paid are one field —
  `paidPaise` — at three values, so they cannot disagree with each other. A stored status
  beside an amount is how a listing prints "Paid" over an invoice with a balance.
- **A cancelled invoice keeps its number and its total.** It is not deleted and the number is
  never reused.
- Overdue is worked out from the due date and what is owed, never stored.
- Dates cross the wire as **ISO days with no time**. An invoice is dated to a day.
- A draft has **no number and no date** until it is saved. Both come back from the backend.

### Bill sundry

- `lastUsedSundries(partyId)` returns the sundries this party had last time. It exists on the
  interface because the picker that needs it will need it **from the backend, not from a
  guess** — users add the same sundries for the same party repeatedly.
- **Bill sundry is built.** This document said it was not, and that the mock returned nothing;
  the mock returns eleven sundries, a picker creates new ones, and a whole journey walks the
  grid with the keyboard. `listSundries(search)`, `createSundry(draft)` and
  `lastUsedSundries(partyId)` are all called by the running screen, so all three need real
  implementations rather than the one this document implied could wait.

### Timing

- Every call is assumed to take time. The mock waits about 220ms behind one wrapper, so that
  loading, empty and failed states had to be designed rather than discovered. `?instant`
  removes the wait for tests that are not about waiting.
