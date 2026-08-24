# Busy Magic v3 — front end

The front end for Busy's next-generation GST invoicing product. It is a **working application
with mock data**, built by the design team, reviewed with stakeholders, and handed to the dev
team who put a real backend behind it.

Windows desktop browser and Tauri. Mobile is a separate build that shares the foundations —
colour, type, spacing, radii, icons, motion — and never shares components. Tablets are this
build at comfortable density, which already measures 44px controls and 48px rows.

## Run it

```
npm install
npm run dev
```

`localhost:5173` opens the invoice listing. `?screen=create` is Create Invoice.
`?screen=invoice&id=…` opens a saved one.

```
npm run storybook
```

`localhost:6006` is the component library — every component on its own, plus the colour, type
and dimension galleries. **This is the design system.** The product team builds against it.

## Check it

```
npm run check
```

Every group reports how many things it ran and **fails if it ran nothing**, because a group
that runs nothing and reports green is the failure this suite exists to prevent.

**A pre-push hook runs this whole command before anything leaves your machine. CI runs it again
on a clean box, minus the journeys**, which are about eighty per cent of the wall clock for a
second opinion on work the hook has already checked. Your own CI —
the workflow in this repository — runs everything, because that is the honest default for
somebody who has just been handed a build. The command prints what it left out and
where that runs instead, every time — there is no arrangement in which a group is dropped
without the run saying so.

What each group is protecting, so that none of them looks like an arbitrary obstacle:

| Group | Where it runs | What it protects |
|---|---|---|
| **types** | hook and CI | Every TypeScript file is covered by a project. A file no `tsconfig` includes is a file nothing type-checks, which is worse than one with errors — it looks fine. |
| **lint** | hook and CI | No file over 250 lines, and no raw Tailwind arbitrary value. Over the cap means a file is two things; an arbitrary value puts a size or a colour back into a component through a door the token scanner cannot see. |
| **shape** | hook and CI | Which way dependencies point. A feature may not import another feature; the library may not import the app; `lib/` stays pure, which is what mutation testing is scoped on. Also: one icon table, one shortcut table, one `ComboBox` behind named wrappers. |
| **tokens** | hook and CI | Every colour, size, weight, line height, duration and curve comes from `packages/tokens`. A raw value in a component is a decision nobody recorded, and it is invisible to every other check. |
| **docs** | hook and CI | Every package `docs/architecture.md`'s stack table names is actually installed. That document is your brief, so a promise in it has to be true. |
| **dead** | hook and CI | Nothing is exported that nothing imports. Dead code still gets read by whoever is working out how something behaves. |
| **tests** | hook and CI | Two tiers: pure logic in Node, components in a real browser. The browser tier exists because the failure this build is named after was seven fields that were never hidden while every test asked whether the hiding *class* was present. |
| **stories** | hook and CI | Every component in `packages/ui` has a story Storybook can actually show. It builds Storybook to find out, measured at five seconds, which is why it stays in every run. The catalogue is a deliverable, not a workbench. |
| **flow** | **hook only** | Whole journeys through a real production build. It is the expensive one — measured on 24-08, 70 seconds of a 91-second run — so CI leaves it to the hook, which runs it on every push before the code exists anywhere else. The full run is always written to `reports/flow-run.log`, so a red run can be read even if the summary was piped away. |
| **drift** | hook and CI | The same run of classes over sixty characters may not appear in two files. Nobody sets out to build a second menu item — somebody copies the line that makes the rows over there look like that, and now there are two, both right on the day, until one gets a focus ring and the other does not. The previous build ended with 158 duplicate definitions and every one started as a copied line. |
| **deps** | hook and CI | Every package a workspace imports is declared in that workspace's own `package.json`. npm hoists a workspace tree into one `node_modules` at the top, so an undeclared import resolves perfectly on your machine and fails the moment anything installs or builds one workspace on its own — which is what a deploy does, and what your first three commands do. Twelve deploys failed on this before the check existed. |
| **visual** | hook and CI | Screenshot comparison. Switched off until baselines are taken on CI — it says so, and says how to turn it on, because a check that is off for a good reason quietly becomes a check that is off. |

## How this repository is kept up to date, and when that stops

**This is a mirror of the design team's build, and it updates itself.** Every time their checks
pass, a new commit lands on `main` here carrying the current front end. It is appended, never
force-pushed.

**Your commits are safe, and here is the mechanism rather than the promise.** Each sync writes
`.mirror-files`, a list of every path it wrote. The next sync starts from *your* `main`, changes
only the paths on that list, and removes only paths that were on the previous list and are no
longer carried. A file you add is not on the list, so nothing touches it — including a file you
add inside a folder the sync otherwise owns, such as `apps/`. Where you edit a file that IS on
the list, the sync overwrites it, because that file is still theirs until you take ownership.

**It stops when you take ownership.** The point where that happens is visible in the code: the
moment you replace `apps/magic/src/data/source.ts` with a real backend and delete
`apps/magic/src/data/mock/`, you are changing the same files the sync still carries, and further
syncs would create conflicts rather than value. Say so and the sync is switched off. Until then
you get every improvement to the front end without asking for it.

## If you are the dev team, read this bit

**Everything pretend lives under `apps/magic/src/data/mock/`, and exactly one file outside it
knows that folder exists: `data/source.ts`.** A gate enforces that. So the handover is:
implement one interface, point that single line at it, delete the mock folder.

`docs/backend-assumptions.md` is written for you. It says what the front end assumes about
shapes, money, dates and failure. Money is integer paise everywhere — never a float, never a
string — and dates are ISO. Anything the front end refuses to decide on its own is named there.

## Deploying it

The deployment settings are in `vercel.json` at the root rather than in a dashboard, so they
travel with the code and you can see what they are:

```
install   npm ci
build     npm run build -w @busy/magic
output    apps/magic/dist
```

**Install at the repository root, not inside `apps/magic`.** This is an npm workspace: the app
reaches `packages/ui` through an alias to the source folder, and that folder's own imports —
React among them — resolve from the tree the root install builds. Installing inside `apps/magic`
alone gets as far as the build and then cannot resolve `react/jsx-runtime` from a library file.
The **deps** check above keeps every workspace honest about what it declares; the root install is
what puts those declarations somewhere the bundler can reach them.

`npm run build` at the root builds every workspace AND Storybook, which is right for a full
check and is not what a deploy of the app wants. Hence the narrower command above.

## Where things are

| Path | What it is |
| --- | --- |
| `apps/magic/src/features/` | The screens. A feature never imports from another feature. |
| `apps/magic/src/lib/` | Arithmetic and rules with no React in them — tax, totals, money, keyboard. |
| `apps/magic/src/data/` | The seam. Schemas, the adapter interface, and the mock behind it. |
| `packages/ui/` | The component library. One file per component, no index, no barrel. |
| `packages/tokens/` | Colour, type, spacing, radius, motion. Zero raw hex or pixels live outside here. |
| `docs/` | Opened when needed, never read end to end. |

## Reading order

Start with `docs/architecture.md` — the stack, why each piece was chosen, and where a new thing
belongs. Then `docs/backend-assumptions.md`, which is the brief: every shape the front end
expects and every assumption it makes about what a backend will send. `docs/components.md` is
the design system in words; Storybook is the same thing you can look at.

**The reasoning lives in the code.** Why something is the way it is is a comment directly above
the thing that enforces it, a test name, or a typed prop — never a document that can drift away
from what it describes. If a decision looks odd, the comment above it says who made it and what
it cost.
