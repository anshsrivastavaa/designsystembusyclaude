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
- **Money shorthand, in money fields only.** `k` is a thousand, `l` is a lakh, `cr` is a crore,
  case does not matter. It converts when the user leaves the field, and the field then holds
  the real number. Any other trailing letter is refused outright rather than guessed at. Never
  in quantity fields, where `l` would collide with litres.

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
