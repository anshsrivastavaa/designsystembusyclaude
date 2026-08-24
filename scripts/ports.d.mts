// The type side of ports.mjs, which is plain JavaScript because node runs the check scripts
// directly and the Playwright configs are TypeScript. One tiny declaration is cheaper than
// either a build step for the scripts or a second copy of the logic.

/** A port for this checkout. `suite` names which server is being started; each reserved suite
 * gets its own so two servers never meet. */
export function portFor(suite: 'flow' | 'visual'): number
