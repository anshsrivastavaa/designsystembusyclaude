import type { ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'

/**
 * Putting a component on the screen for a test, and taking it down again afterwards.
 *
 * WHY THIS IS NOT `createRoot` WITH A TIDY-UP LINE. Five of the six component tests in this
 * repository created a root and then only removed the host element from the document. Removing
 * the host does not unmount anything: React still holds the tree, its effects have never run
 * their cleanups, and everything it subscribed to is still subscribed. Every store in this app
 * is a module-level singleton shared by the whole file, so a test that has "finished" goes on
 * receiving every change the next test makes and re-rendering into a detached node. The item
 * grid's tree kept a ResizeObserver and a window resize listener alive that way — its own
 * cleanup is written correctly and simply never ran.
 *
 * That is one of the two things making the suite fail differently when run whole than when run
 * one file at a time. The other was a shared barrier that guessed a timeout, and it is fixed in
 * settled.ts. Both are the same shape of fault: something invisible in a single test that only
 * shows up as flakiness in a full run, which is where it is hardest to chase.
 *
 * It is one helper rather than the same six lines written six times because the fault was
 * forgetting, and a thing you have to remember in every new test file is a thing that will be
 * forgotten again. A shape check refuses a component test that calls `createRoot` directly.
 */

const roots: Root[] = []

/** Render a tree and remember its root, so `unmountAll` can take it down. Returns the root,
 * because a test that re-renders to change a prop needs it. */
export function mounted(at: Element | DocumentFragment, node: ReactNode): Root {
  const root = createRoot(at)
  roots.push(root)
  root.render(node)
  return root
}

/** Take down everything mounted since the last call. Belongs in `afterEach`, and it has to run
 * BEFORE the host element is removed: unmounting is how a tree — and a portal, which lives
 * outside the host entirely — lets go of the document. */
export function unmountAll(): void {
  for (const root of roots.splice(0)) root.unmount()
}
