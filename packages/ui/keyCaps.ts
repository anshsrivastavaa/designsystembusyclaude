// WHAT THE KEY IS CALLED ON THE MACHINE IN FRONT OF YOU.
//
// The transport drawer's foot read "Alt+V opens this" to somebody on a Mac, where that key is
// marked Option and there is no Alt written on it anywhere. A hint that names a key the keyboard
// does not have is worse than no hint: it sends a person hunting for something that is not there.
//
// IT IS A NAME, NOT A BEHAVIOUR. Only keys where the SAME physical key carries two names are
// translated. Alt and Option are one key and fire `altKey`, so calling it Option on an Apple
// keyboard is telling the truth in the reader's own words. Ctrl is deliberately NOT turned into
// Command: those are two different keys firing two different flags, and renaming one to the other
// would be a hint that does not work. If a shortcut ever wants Command it has to bind Command.
//
// ONE PLACE, SO EVERY HINT MOVES AT ONCE. It lives here rather than in the feature that noticed
// it, because a second feature branching on the platform for itself is how a product ends up
// telling two people two different things about the same key.

/** Read fresh on every call rather than cached, so a test can stand the browser somewhere else
 *  and measure what is actually drawn. A cached answer would make the second platform untestable
 *  without reloading the page. */
function onApple(): boolean {
  if (typeof navigator === 'undefined') return false
  const said =
    (navigator as { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    ''
  return /mac|iphone|ipad|ipod/i.test(said)
}

/** Modifier names that differ between keyboards. Everything else — Shift, Esc, Enter, Tab, the
 *  function keys — is the same word on both and is left exactly as it was written. */
const APPLE_NAMES: Record<string, string> = {
  Alt: 'Option',
  Option: 'Option',
  Meta: 'Command',
  Cmd: 'Command',
  Command: 'Command',
}

const OTHER_NAMES: Record<string, string> = {
  Option: 'Alt',
  Alt: 'Alt',
  Meta: 'Win',
  Cmd: 'Win',
  Command: 'Win',
}

/** What to print on the cap for a key, given the keyboard the reader has. */
export function capFor(keyName: string, apple: boolean = onApple()): string {
  const named = apple ? APPLE_NAMES[keyName] : OTHER_NAMES[keyName]
  return named ?? keyName
}
