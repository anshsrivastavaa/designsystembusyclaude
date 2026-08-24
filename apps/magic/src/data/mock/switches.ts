// Switches that exist only because the data is pretend. They live here so that deleting this
// folder deletes them, and nothing outside it ever asks whether the data is real.

function asked(name: string): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has(name)
}

/** `?instant` answers with no delay, for tests that are not about waiting. */
export const instant = () => asked('instant')

/** `?refuse` makes saving come back refused, so the refusal state can be looked at. */
export const refuseTheSave = () => asked('refuse')
