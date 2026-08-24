# Architecture

Not part of the session read-in. Open it when you need to know why something is the way it
is, or where a new thing belongs.

## The one rule that shapes everything else

**There is one application, not a prototype and a production version.**

The last build tried two codebases in parallel — a stitched HTML prototype and a React app
meant to become the real thing. The React one starved and was retired after five weeks.
Two codebases always starve one.

So: one app, with mock data today and real data later. The seam between them is a **data
adapter**, not a second repo. Dev swaps one file.

## The stack, and why in plain words

| Layer | Choice | Why |
|---|---|---|
| Build tool | Vite | Starts instantly, rebuilds in milliseconds |
| Framework | React 19 | Agreed with dev |
| Language | TypeScript, strict mode | The computer catches mistakes before a person does |
| Styling | Tailwind v4 | Its theme system is built on CSS variables, so our tokens stay the single source |
| Components | shadcn/ui on Radix | Copied into our repo as source we own and edit, not a dependency we wrap. **cmdk (not installed)** was named here for weeks. `ComboBox` is hand-written because that library owns the highlight, and this build needs a pinned lead row the keyboard walks past — see the comment at the top of `packages/ui/ComboBox.tsx` |
| Item grid | hand-written | **TanStack Table (not installed).** It was named here for weeks with zero imports anywhere. The grid's keyboard rules are bespoke — Enter walks Item, Qty, Price, then the next row — and column freezing is a sticky-position offset rather than the bookkeeping a table library exists to do. See the note below for the day that stops being true |
| Client state | Zustand | One small store per feature. No ceremony, readable by a stranger |
| Server state | none — `data/source.ts` and `useEffect` | **TanStack Query (not installed).** Not used. Every screen calls the adapter in an effect and holds the answer in local state. That is honest for a mock with seven calls and it is what the dev team will find; it is named as a gap below rather than as a decision |
| Forms | zod schemas, hand-written fields | **react-hook-form (not installed).** Not used. Fields hold their own draft state; see `EditableCell` for why a numeric field must |
| Tests | Vitest in Node and in a real browser, Playwright for whole journeys | `npm run check` is the list — every group prints how many things it ran and fails if it ran none |
| Component catalogue | Storybook | Doubles as the handover document |
| Desktop | not started | **Tauri (not installed)**, and there is no `src-tauri`. The intention below stands; nothing is wired |

## What we deliberately did not choose

Recorded so nobody re-argues it without new information.

- **React Aria instead of Radix.** Its strength is keyboard navigation inside a grid — but
  our grid keyboard rules are bespoke (Enter walks Item, Qty, Price, then the next row) and
  its focus manager would fight them. Screen-reader depth, its other advantage, is not a
  requirement here. Radix is copied source, so if one primitive disappoints we replace that
  one file.
- **Redux Toolkit.** Built for large teams needing strict, auditable patterns. We are one
  person and a model.
- **A separate design-system repository.** Splitting before a second real consumer exists
  buys version-mismatch pain for nothing. The split waits — but the boundary is real rather
  than aspirational. `packages/ui` is imported as `@busy/ui/Button`, never as a climb up four
  directories; it carries its own stylesheet so a component can be rendered with no
  application present; and a check fails if anything in it imports from `apps/`. This
  paragraph used to say "the folder layout is ready for the split" while ninety-one imports
  and six of the library's own tests said otherwise.
- **TanStack Table for the item grid.** Named in the stack table from the first day and never
  imported once. What a table library sells is bookkeeping — column models, row models, sorting
  and grouping state — and this grid's hard parts are none of those: the keyboard walk is
  bespoke, and freezing a column is a sticky-position offset over an array of widths. Removed on
  22-08 rather than left as a promise the dev team would go looking for. **It comes back if the
  column engine turns out to be bookkeeping after all** — if resize, pin and reorder start
  needing a model that has to stay consistent with itself, that is exactly what the library is
  for, and this paragraph is the permission to reach for it.
- **Porting the v2 test suite.** Its checks are tied to HTML that no longer exists, and it went
  green through two bugs that killed the page — which is why every check in this build asserts
  computed style or behaviour and never a class name.

## Folder layout

```
packages/
  tokens/          the design tokens, and nothing else
  ui/              shadcn primitives and our own shared components
apps/
  magic/
    src/
      lib/         money, gst, dates, keyboard - pure functions, held by a check
      data/
        schema/    zod schemas: invoice, party, item, sundry, settings, insights, refusal
        adapter.ts the one interface between the app and its data
        mock/      the mock world
      features/
        invoice/
        listing/
      app/         the shell: rail, top bar, menus, settings, theme. No router — see below
docs/
```

**A feature never imports from another feature.** Anything two features need moves to
`packages/ui` or `lib/`. This is checked, not trusted.

## The data adapter

Every screen asks the adapter for data. It never calls an API and never reaches into the
mock world directly.

**The interface is `apps/magic/src/data/adapter.ts`. Read it there, not here.** This document
used to print a copy of it, and the copy said five methods returning the plain thing. The real
one has fourteen, and **every single one returns `Answer<T>`** — either the value or a `Refusal`
saying why not. Anyone who implemented what the copy showed would have written the wrong
interface and found out at compile time, having built it.

That is why there is no code in this section any more. A printed copy of a live file is a second
version of it that nothing keeps in step, and this one drifted by ten methods and the entire
error model before anybody noticed.

`Answer<T>` is the piece that matters most and is easiest to skip:

```
export type Answer<Value> = Value | Refusal
```

A screen cannot use the value without first handling the refusal, because it will not compile
otherwise. That is deliberate: a backend that can say no is the normal case — a party that no
longer exists, a number series that has run out, a save that lost a race — and a front end that
assumes yes is a front end that shows a blank screen when it happens.

Today one file implements the interface against mock data. Later a second file implements it
against the real backend. Nothing else in the application changes: **implement one interface,
point `data/source.ts` at it, delete `data/mock/`.**

## The schemas are the API contract

Every shape the product handles gets a zod schema in `data/schema/`. One schema does four
jobs at once:

1. Validates what the user typed
2. Generates the TypeScript types, so they can never drift from the validation
3. Shapes the mock data, so the mock world cannot describe an impossible invoice
4. **Printed out, it is the API specification the backend team builds against**

Point four is the most valuable thing we hand over. It is a real document, generated from
working code, that cannot go stale.

## State

Two kinds, kept apart.

- **Server state** — anything that came from the adapter. There is no library for it: a screen
  calls `data.*` in an effect and holds the answer. See the gap named below.
- **Client state** — the invoice being edited, which drawer is open, the theme. Zustand
  owns it, one store per feature, in `features/<name>/store.ts`.

The invoice currently being edited is client state until it is saved. That is the one place
the distinction gets blurry, so it is written down here.

## Theming

Tokens are two layers, and the split is what makes new themes cheap.

- **Palette** — the raw values. `purple-600`, `grey-100`, `space-4`.
- **Semantic** — what things mean. `accent`, `surface`, `border-subtle`, `field-height`.

Components only ever use semantic names. A new theme redefines the semantic layer against
the same palette, and no component changes. Light and dark ship first; more are then a data
change rather than a build.

## Desktop

Tauri 2 is wired at the end of the foundation phase, once the first components exist and
before any screen is built. Adding a desktop shell to a mature web app is a retrofit, so it
goes in early — but not on the first commit, because Tauri needs the Rust toolchain
installed and that would slow every foundation step for no benefit while there is nothing
to put in a window.

Nothing in `apps/magic` may call a Tauri API directly. If desktop-only behaviour is needed,
it goes behind a small module in `lib/` so the web build still works.


## What is NOT built, and would be found missing

**Corrected on 21-08 after a production audit.** This table named four dependencies that were
never installed, and the dev team's brief is "implement one interface and the front end works"
— so a document naming a server-state layer that is not there is a promise they would discover
by looking for it. A gate now fails the build if this document names a package `package.json`
does not carry.

- **No server-state library.** Every call is a `useEffect` and local state. Seven calls, no
  caching, no refetching, no request de-duplication. A real backend wants one; the decision is
  not made and nothing depends on it yet.
- **No virtualisation.** The item grid renders every row. Measured at 2000 rows: 20,020 cells,
  54,199 elements. This is the one gap that is already costing something. **The number is
  measured, not repeated here**: `ItemGrid.tsx` carries the count and the comment beside the
  memoisation that fixed the worst of it, because a figure copied into a document goes stale
  silently and no check can catch it.
- **No form library.** Fields hold their own draft state by hand, which is deliberate for the
  grid — a numeric cell has to keep what is typed rather than what is stored — and simply
  unexamined everywhere else.
- **No Tauri.** No `src-tauri`, no Rust toolchain, no desktop build. The rule below about never
  calling a Tauri API directly stands for the day it arrives.
