# Components

The standard a component must meet before it counts as done, and the rules for using the
library. **It is not a list of what exists.** Storybook is that list, and a gate now fails when
Storybook cannot show every component in `packages/ui` — so the list has a keeper, which is
what this file was not.

That is worth saying out loud, because this file spent weeks being wrong in exactly that way:
it named two components that had never been built, missed twelve that had, and described a
folder-per-component layout the code has never used. `packages/ui/package.json` already argues
against a barrel file partly because **"it becomes a second list of what exists, alongside the
folder, that somebody has to remember to update."** This file was that second list, in prose,
and nobody remembered. The folder is the truth and Storybook is the shop window.

## Bare first, then layers

**A component is built in its simplest correct form first.** A ComboBox that lets you pick an
item. Nothing else. It gets reviewed at that size.

Every behaviour on top of that — a pinned row at the top, a create row pinned at the bottom,
arrow keys that account for both, a scrolling marquee — is added afterwards, one at a time,
**each as its own commit with a one-line reason**.

This is deliberate. In the last build, behaviour accumulated over many rounds of back-and-forth
until simple things were complicated and nobody could say why. Some of that behaviour is
genuinely needed. Some was never justified, and some is wrong — a dropdown that opens on focus
sometimes and not others. Adding layers one at a time is how we find out which is which.

**If nobody can say in one sentence why a layer exists, it does not get built.**

## Definition of done

A component is not done until all of this is true.

1. **A typed prop API.** No `any`. Every prop has a purpose that can be said in a few words.
2. **Every state in Storybook** — default, hover, focus, active, disabled, loading, error,
   empty. If a state cannot happen, say so in the story file rather than leaving it out.
3. **Both themes, light and dark.** *Dark does not exist yet — it is step five of the build
   order — so today this means the story is written so that adding dark does not mean
   rewriting it. When dark lands, every story gets checked in it and this line stops carrying
   an asterisk.*
4. **One browser test per interactive behaviour**, named after the rule it proves.
5. **Its keyboard behaviour written as tests**, not as prose. Keyboard is how this product is
   actually used.
6. **No raw colours or sizes.** Semantic tokens only, and a gate enforces it.
7. **A live look.** Somebody opened it and thought it looked right.

## Conventions

- **One component, one file, named after the component**, flat in `packages/ui`.
  `Drawer.tsx`, `Drawer.stories.tsx`, `Drawer.component.test.tsx`, side by side. There is no
  folder per component and no index that re-exports the set — `@busy/ui/Drawer` is the file,
  and the file is the truth.
- **Props describe intent, not appearance.** `tone="danger"`, not `color="red"`. The theme
  decides what danger looks like.
- **No component decides its own margin.** Spacing belongs to whatever contains it.
- **Every interactive component forwards its ref and accepts `id`**, so labels, focus and
  keyboard shortcuts can reach it.
- **Nothing is disabled without saying why.** A disabled control carries a title or a
  neighbouring line explaining what would enable it. A dead control with no explanation is
  worse than no control.

## The two tables — where the line is drawn

**Everything above the first row is shared. Everything below it is not.** Ruled 23-08, after an
audit found a contrast fix that had reached the listing and never travelled to the item grid.

The listing renders a real `<table>` of records you read and pick from. The item grid is
hand-written markup wearing `role="grid"`, where every cell is a field you type into. They can
never be one component — `ItemGrid.tsx` says why at the top, and it is right: a component that
is both grows a mode flag, then a second, and after that no change to either screen is safe.
Linear's list and Airtable's grid do not share an engine either.

**But three things are the same on both and belong in `packages/ui`.**

- **The column engine.** `useColumns` already computes sizes, pins and handles headlessly. It
  takes column ORDER too — `reorder()` is arithmetic over an array of ids and there is no
  argument for a second copy.
- **The column-setup popover.** A list of columns with ticks. One component, one named wrapper
  per feature, which is already the rule for `ComboBox` and already gated.
- **The heading cell.** This is the one that has already cost us. `TableHead` was moved off muted
  ink to secondary for a measured reason; the item grid draws its own inline and was never
  moved with it. Sort marks, row heights and pin affordances will each drift the same way.
  It renders as a `<th>` or as a plain element, the same polymorphism the resize handle takes.

**The body stays separate, permanently.** That is where the two genuinely differ, and it is the
only place they should.

## Rules that cross components

- **Nothing renders under a row in the item grid.** One item, one line.
- **No toasts for validation.** An error appears beside the field it belongs to. On an item
  row, the offending cell is marked and the reason is written on the strip above the table.
- **A list never moves the selection somewhere the user cannot see it.**

## Rules that belong to one component

These four are real and they are written here because they have nowhere better yet. **Each one
belongs as a comment directly above the code that enforces it**, which is what this repo's own
rule says — a ruling that can drift is in the wrong place.

- **Button never ends its label in an ellipsis**, and its loading state replaces the label
  without changing the button's width.
- **ComboBox's list has a fixed maximum height.**
- **There is exactly one Drawer in the product.** Every drawer is that component with a
  different body. It owns the scrim, the focus trap and Escape, and never allows a second
  drawer on top of a first.
- **Popover is for short things.** If it needs to scroll and hold a sticky footer, it has
  become a Drawer wearing a Popover's clothes — use the Drawer.

## For the product team

You are working in Emergent and Claude rather than Figma, so **Storybook and `packages/tokens`
are the design system**, and this file is the standard behind them.

**How to use it.** Open Storybook to see what exists and what each thing does. Point Claude at
`packages/tokens` and at this file, and ask for a screen in terms of the components you saw.
What comes back will be on-system.

**What not to do.** Do not invent a component that is nearly one of these. If something you
need is missing, that is a request, not a gap to fill locally — the whole value of a design
system is that there is one of each thing.

**How to request a change.** Say what you were trying to build, what got in the way, and what
you did instead. That is enough. The change gets made here and everyone gets it.

---

## The variant plan, 24-08 — what is left to build, and what it is built from

Aj's rule, in his words: *"no components hardcoded, we need to reuse as many as possible"* — meant
the way a Figma library is meant. A small set of components, each carrying variants, composed
everywhere. Never a new one-off per use.

An inventory on 24-08 counted twenty-five components and read the variant definition of each. **Two
things came out of it.** The library is further ahead than the product: three components and five
variants exist with **zero call sites**, built for jobs that are still being hand-written beside
them. And everything still owed on Create Invoice is served by what exists plus eight variants —
**at most two genuinely new components, and one of those is conditional on a decision Aj has not
made yet.**

### Built, and used by nothing

Each of these was written for a job that is today hand-rolled somewhere in the product. Adopting
them is the whole of the "stop hardcoding" work; there is nothing to design.

| Exists | Call sites | Written for |
|---|---|---|
| `Disclosure` | **0** | Four hand-written collapsibles: `Breakdown.tsx:58`, `TaxSummary.tsx:65`, `Narration.tsx:26`, `DrawerField.tsx:93`. Its own header says so |
| `TableHeading` `as="div"` | **0** | The item grid's column heading, drawn inline at `ItemGrid.tsx:154-176` and again at `SundryGrid.tsx:21-34` |
| `Tabs look="bare"` | **0** | The narration's Printed/Internal, hand-rolled at `Narration.tsx:54-71` with no arrow keys |
| `TextField locked` | 0 | The sunken read-only cell `ItemRow.tsx:9` names as a row state |
| `Field message` / `reservesMessage` | 0 | The reserved message line that stops a form jumping when an error appears |
| `Label htmlFor` | 0 | Tying a label to its control, which is why no invoice field has one |

### The eight variants

Each names the hand-rolled thing it replaces. None is a new component.

| Variant | Replaces |
|---|---|
| `Disclosure chevron="lead" \| "trail"` | Breakdown's chevron sits after the figure, not before the word |
| `Tabs look="chips"` | The zone chips hand-written at `Settings.tsx:149-168` |
| `Toggle look="boxed"` | The bordered span written twice around the two switches, `ActionBar.tsx:87` and `:92` |
| `Chip shape="pill"` | The "Partly paid · balance X" pill hand-drawn at `ActionBar.tsx:82-84` |
| `Button variant="on-dark"` | The whole local `DarkButton` component at `BulkBar.tsx:61-79` |
| `Button size="xs"` | The strip's menu trigger, one authored step below body, `TopMenu.tsx:54-64` |
| `SearchBox collapsible={false}` | The icon-plus-field row rebuilt at `Settings.tsx:136-144` |

### The two components that did not exist — BOTH ARE BUILT AND ADOPTED, 25-08

Kept as the record of why they exist, because this file ships to the dev team and a section headed
"do not exist" about two components they can see is worse than no section at all.

- **`MenuRow`** — built, six importers. It replaced **four** implementations of one idea:
  `listing/MenuItem.tsx`, `app/MenuLine.tsx`, `FieldSettings.tsx` and `VoucherSwitch.tsx`, where a
  `Button` was overridden into a menu row. They had already drifted — one marked the chosen row with
  a rotated chevron, another with a tick. **The chevron won the adoption and that is still wrong:**
  a tick means chosen, a chevron means there is more behind this. Owed to `MenuRow`, and when it
  changes all six sites follow, which is the point.
- **`Select`** — built, four importers. It replaced four hand-styled native selects with four
  different class runs, one of which had no focus ring of the product's own at all.

Conditional, and **not** to be built before Aj rules: a centred **`Dialog`**, needed only if the
"reason before cancel or delete" is not a `Drawer` — `Drawer` already owns the scrim, Escape, focus
return and a `footer` slot, and this file already rules that a Popover needing a sticky footer has
become a Drawer.

### The gate does not cover this, and that is why it kept happening

`scripts/check-shape.mjs` enforces "a generic component is never dropped straight onto a screen"
for **one component out of twenty-five** — `ComboBox` — by a regex that does not even match
`ComboBoxList`. `Popover` is dropped straight onto fourteen screens, and **eight of them declare
their own `role="menu"` container**, which is how four menu rows got built with every gate green.
`check-drift.mjs` is the partial net and it only sees byte-identical class runs, so two files
expressing the same idea in different words pass it.

**So the rule as written is enforced for one case and documented as general.** Widening the check
is what stops this recurring; until it is widened, this section is the list.

## Built, and waiting for a screen

Building ahead of the screen is allowed. It costs a line here naming the job and the date, and
the `exports` gate fails on anything in the library that has neither a screen nor a line. **The
date is the point** — it makes the length of the wait visible, so "it will be adopted next week"
cannot quietly become two months.

- **`Disclosure`** — written **24-08** for the four collapsible section headers that had each been
  hand-written: the invoice breakdown, the tax summary, the narration and the drawer's extra
  fields. A fifth was about to be written in a folder that could not import any of the first four,
  which is the dependency rule pointing at where the thing belonged. **Waiting for:** the other
  session to adopt it in those four places; it holds `closedAside` and `tone="accent"` because
  those four needed them. Nothing about it is blocked — Aj ruled on 25-08 that every backend
  figure is invented in `data/mock/`, so a component ahead of its screen is unadopted, not stuck.

**`TableHeading` is not on this list, and the gate will not ask for it**, because `TableHead`
uses it on every listing row — it is genuinely in the product. What has no screen is its
`as="div"` mode, built for the item grid's column headings.

**Do not read the `exports` gate's green as "every mode is in use".** It works at the granularity
of an export and cannot tell a half-used component from a fully used one. The variant gate next
door only asks whether a value draws differently from the base, never whether a screen asked for
it. **A variant nobody uses is covered by nothing today**, and `TableHeading as="div"`,
`Tabs look="bare"`, `TextField locked`, `Field message` and `Label htmlFor` are all in that gap
right now. The same sentence is in the gate's own header, so it is read by whoever is looking at
the gate rather than only by whoever is looking here.
