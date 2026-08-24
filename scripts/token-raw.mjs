// Raw colours and raw sizes, anywhere but the token package.
//
// The previous build enforced the colour half by searching for hex codes only, so a raw
// pixel value sat in a stylesheet unseen for weeks. Both halves are here, and both look at
// every kind of source file rather than at a folder called src.

import { readFileSync } from 'node:fs'

import { sourceFiles } from './source-files.mjs'

export const SCANNED = ['.ts', '.tsx', '.css', '.html']
export const TOKEN_PACKAGE = 'packages/tokens'

// One exception, and it has to be written down where the rule is.
// .storybook/preview-head.html paints the panel that appears when the preview bundle fails
// to load. It runs at the moment the stylesheet may not have arrived, so it cannot read a
// token — a token-coloured error screen that is invisible during a stylesheet failure is
// worse than no error screen. Nothing else may join this list without the same argument.
const EXCEPTIONS = ['.storybook/preview-head.html']

const HEX = /#[0-9a-fA-F]{3,8}\b/
const RGB = /\brgba?\s*\(/
const PIXELS = /(?<![\w-])-?\d*\.?\d+px\b/

// Weight is decided in packages/tokens/weight.css, in four steps named by job, and nowhere
// else. Tailwind's own weight names are cleared out of the theme so these classes no longer
// build anything — but a dead class is silent, and silence is how the ad-hoc ones arrived in
// the first place. This makes it loud. `font-weight:` in a stylesheet and `fontWeight` in a
// style object are the same offence by another route.
const WEIGHTS =
  /(?<![\w-])(?:font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b|font-weight\s*:|fontWeight)/

// Line height, for the same reason and by the same three routes. It is the thing that makes a
// grid feel tight or loose while nobody can name why, so it is the last thing to leave to
// whatever the browser decides — which is what 14px text in a 34px row was until 20-08.
const LEADINGS =
  /(?<![\w-])(?:leading-(?:none|snug|normal|relaxed|loose)\b|line-height\s*:|lineHeight)/

// Duration and curve, decided in packages/tokens/motion.css in three speeds named by what
// moves, and nowhere else. Until 22-08 the product had no motion tokens at all, so every
// transition in it was Tailwind's default 150ms ease — one duration and one curve applied to
// whatever anybody remembered to type, which is most of why the screens read as flat.
//
// Tailwind's `duration-<number>` accepts any bare number, so unlike colour and weight the
// default can never be cleared out of the theme: it has to be made loud instead. `ease-in` and
// friends ARE cleared, so they build nothing — and a dead class is silent, which is exactly how
// the ad-hoc values arrived last time.
//
// Scoped to motion contexts rather than to any number followed by ms, on purpose. A comment
// naming a hundred-millisecond performance budget is prose about a test, not a value anybody
// is going to animate with, and a rule that cries at prose gets switched off.
const DURATIONS =
  /(?<![\w-])(?:duration-\[?\d|ease-(?:in|out|linear)\b|(?:transition|animation)-duration\s*:|transitionDuration|animationDuration|(?:transition|animation)\s*:[^;]*[0-9.]+m?s\b)/

export function scannedFiles() {
  return sourceFiles(SCANNED, { without: [TOKEN_PACKAGE, ...EXCEPTIONS] })
}

function offences(pattern) {
  const found = []
  for (const file of scannedFiles()) {
    const lines = readFileSync(file, 'utf8').split('\n')
    lines.forEach((line, index) => {
      const withoutComment = line.replace(/\/\/.*$/, '')
      const match = withoutComment.match(pattern)
      if (match) found.push({ file, line: index + 1, text: match[0] })
    })
  }
  return found
}

export const rawColours = () => [...offences(HEX), ...offences(RGB)]
export const rawPixels = () => offences(PIXELS)
export const rawWeights = () => offences(WEIGHTS)
export const rawLeadings = () => offences(LEADINGS)
export const rawDurations = () => offences(DURATIONS)

function noRawColours() {
  return {
    rule: 'no raw hex or rgb outside packages/tokens',
    counted: `${scannedFiles().length} files`,
    failures: rawColours().map(({ file, line, text }) => `${file}:${line} — ${text}`),
  }
}

function noRawPixels() {
  return {
    rule: 'no raw pixel value outside packages/tokens',
    counted: `${scannedFiles().length} files`,
    failures: rawPixels().map(({ file, line, text }) => `${file}:${line} — ${text}`),
  }
}

// The weight ladder is four steps named by job. A component typing font-semibold is choosing
// a weight nobody decided, which is how the screen came to read as default Tailwind wearing
// our colours.
function noRawWeights() {
  return {
    rule: 'no raw font weight outside packages/tokens',
    counted: `${scannedFiles().length} files`,
    failures: rawWeights().map(({ file, line, text }) => `${file}:${line} — ${text}, not a step on the weight ladder`),
  }
}

// Three named ratios, and the body one moves with density. A component choosing its own line
// height is choosing the thing that decides whether a table feels tight, without saying so.
function noRawLeadings() {
  return {
    rule: 'no raw line height outside packages/tokens',
    counted: `${scannedFiles().length} files`,
    failures: rawLeadings().map(({ file, line, text }) => `${file}:${line} — ${text}, not one of the three ratios`),
  }
}

// Three speeds named by what moves, and one curve for each direction. A component choosing its
// own duration is choosing whether the product feels quick or sticky, one control at a time and
// without saying so — which is what Tailwind's default 150ms was doing everywhere until 22-08.
function noRawDurations() {
  return {
    rule: 'no raw duration or curve outside packages/tokens',
    counted: `${scannedFiles().length} files`,
    failures: rawDurations().map(({ file, line, text }) => `${file}:${line} — ${text}, not one of the three speeds`),
  }
}

// The five raw-value rules, as the token group runs them. They live here rather than in
// check-tokens.mjs because they are one subject — what may not be typed outside the token
// package — and because that file crossed 250 lines, which was the cap correctly saying it had
// become several things. Exported as a list so a rule added here cannot be left off the group:
// a check nobody registered runs never and reports green, which has happened three times.
export const rawValueChecks = [noRawColours, noRawPixels, noRawWeights, noRawLeadings, noRawDurations]
