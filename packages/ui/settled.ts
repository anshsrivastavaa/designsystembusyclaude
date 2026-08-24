// The barrier a component test waits on before it measures anything.
//
// WHY THIS EXISTS. The pattern copied around the component tests was "await a timeout, then
// await an animation frame, then measure". That is a guess at how long React 19 takes to
// commit, and under a full suite the guess is sometimes wrong: a twelve-run sweep on 20-08
// failed once each in Button, Table and Checkbox, on three unrelated assertions, with the
// tree simply not on the screen yet. A flaky suite is worse than a slow one — it trains
// everybody to re-run instead of to read.
//
// So this waits for the thing to be TRUE rather than for a length of time. It keeps giving
// the browser frames until the caller's condition holds, and gives up loudly rather than
// hanging if it never does. A machine under load takes more frames and the test still
// passes; a genuine break runs out of frames and says so.

/** How long to keep offering frames before calling it a real failure. Long enough for a
 * loaded CI box, short enough that a broken test does not look like a hung one. */
const GIVE_UP_AFTER_MS = 3000

/** One macrotask and one paint — the smallest unit of "let the browser get on with it". */
const oneFrame = async () => {
  await new Promise((resolve) => setTimeout(resolve, 0))
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)))
}

/**
 * Waits until `until` returns true, then returns. With no condition it waits a single frame,
 * which is right when nothing is being mounted and the test just needs the paint.
 *
 * Pass a condition whenever the test is about to measure something React has just rendered.
 * The condition should ask for the thing the test needs — "the input is on the screen" —
 * never for the thing the test is trying to prove.
 */
export async function settled(until?: () => boolean) {
  const deadline = Date.now() + GIVE_UP_AFTER_MS

  for (;;) {
    await oneFrame()
    if (!until || until()) return
    if (Date.now() > deadline) {
      throw new Error(`settled(): gave up after ${GIVE_UP_AFTER_MS}ms — the tree never reached the state the test was waiting for`)
    }
  }
}
