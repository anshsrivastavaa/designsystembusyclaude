// Contrast ratio, the WCAG 2 formula. Used by the token gallery so the numbers beside an
// ink step are measured from the live stylesheet rather than typed in — a token change has
// to move the number, or the number is decoration.
//
// It lives in the token package because its subject is the tokens, and because a test of
// colour arithmetic has to name colours — which is legal here and nowhere else.
//
// This is not the contrast gate. That is built at the dark theme step, where a second
// authored palette gives it something to compare.

function channels(colour: string): [number, number, number] | null {
  const hex = colour.trim().match(/^#([0-9a-f]{6})$/i)
  if (hex?.[1]) {
    const value = hex[1]
    return [0, 2, 4].map((at) => parseInt(value.slice(at, at + 2), 16) / 255) as [number, number, number]
  }

  const rgb = colour.trim().match(/^rgba?\(([^)]+)\)$/i)
  if (rgb?.[1]) {
    const parts = rgb[1].split(/[,/\s]+/).filter(Boolean).slice(0, 3).map(Number)
    if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
      return [parts[0]! / 255, parts[1]! / 255, parts[2]! / 255]
    }
  }

  return null
}

function relativeLuminance(colour: string): number | null {
  const parsed = channels(colour)
  if (!parsed) return null
  const [r, g, b] = parsed.map((c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
}

/** Returns null when either colour cannot be read, so the gallery shows a gap, never a lie. */
export function contrastRatio(foreground: string, background: string): number | null {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  if (first === null || second === null) return null
  const lighter = Math.max(first, second)
  const darker = Math.min(first, second)
  return (lighter + 0.05) / (darker + 0.05)
}
