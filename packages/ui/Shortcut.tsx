// A key cap: the mark that says which key does the thing beside it.
//
// ONE OF THESE, USED BY EVERY HINT ON EVERY SCREEN. There were hand-written spans and hand-
// written <kbd>s in three places already, each with its own padding and its own idea of how
// loud a key should be. That is how the previous build reached 158 definitions of things that
// should have been one, and a shortcut hint is exactly the sort of small thing nobody thinks
// worth a component until there are six of them.
//
// IT KNOWS NOTHING ABOUT WHAT ANY KEY DOES. The key arrives as a prop. What F2 or F10 MEANS is
// decided in lib/shortcuts.ts and nowhere else, and the function-key map is open — Aj is
// re-cutting it, and the answer differs from both the product document and what is built. A
// component that hard-coded a key would have to be edited when that lands; this one does not.
//
// IT IS A <kbd>, WHICH IS WHAT THE ELEMENT IS FOR. The browser's own stylesheet then sets it in
// monospace, and until 23-08 nothing overrode that — so every hint was drawn in SF Mono while
// the words beside it were the product's face. The zero in F10 is the glyph that gives that
// away. The fix is one line in the base layer of styles.css rather than here, so a hint written
// by hand anywhere is fixed too.

import { cn } from './cn'
import { capFor } from './keyCaps'

export type ShortcutProps = {
  /** The key as a person says it: `F2`, `Esc`, `Ctrl`, `↵`. One cap per key — two keys pressed
   * together are two of these with a thin `+` between, which the caller writes.
   *
   * WRITE THE KEY YOU BOUND, NOT THE WORD YOU WANT PRINTED. `Alt` comes out as Option on an Apple
   * keyboard, where that is what the key is marked and there is no Alt on it anywhere. See
   * keyCaps.ts for which names are translated and why Ctrl is not one of them. */
  keyName: string
  /** Quiet by default. `strong` is for a cap on a filled control, where the muted step
   * disappears into the fill. */
  tone?: 'quiet' | 'strong'
  className?: string
}

export function Shortcut({ keyName, tone = 'quiet', className }: ShortcutProps) {
  const printed = capFor(keyName)

  return (
    <kbd
      className={cn(
        // A CAP, NOT A WORD. The border and the sunken fill are what make it read as a key
        // rather than as text that happens to be short — which is what Aj said the old one
        // looked like. Caps size, because it is scanned on the way to something else and never
        // read as a sentence; uppercase and letterspaced for the same reason.
        'inline-flex shrink-0 items-center justify-center rounded-control border px-1.5',
        'text-caps font-label tracking-wide uppercase tabular-nums',
        // The tight ratio, which is the authored step for a thing that is scanned rather than
        // read — a cap beside a line of body text must not push the line taller than its
        // neighbours.
        'leading-tight py-1',
        tone === 'strong'
          ? 'border-on-accent/40 bg-transparent text-on-accent'
          : 'border-stroke bg-surface-sunken text-ink-secondary',
        className,
      )}
    >
      {printed}
    </kbd>
  )
}
