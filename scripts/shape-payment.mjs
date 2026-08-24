// WHO MAY WORK OUT WHAT AN INVOICE IS WORTH.
//
// Two functions answered this. lib/payment.ts said in its own comment that it existed "so the
// listing screen and this one cannot answer the question differently" — and it was imported by
// its own test and nothing else, while seven listing files used a second copy that disagreed
// with it on the vocabulary, on whether overdue was a state or a flag, and on whether a balance
// could go negative. Nobody noticed for weeks because both were internally consistent.
//
// The arithmetic is four fields and three comparisons, which is exactly why it grows back: it
// is quicker to type `invoice.cancelledAt !== null` than to find out what the shared answer is
// called. So the arithmetic itself is what is forbidden, not the duplicate file.
//
// Tests are excluded and the mock is not. The mock BUILDS invoices, so it sets these fields by
// definition; its tests then assert the world it built contains a cancelled one and a part-paid
// one, which is a claim about DATA rather than a second opinion about state.

import { readFileSync } from 'node:fs'

import { sourceFiles } from './source-files.mjs'

const HOME = 'apps/magic/src/lib/payment.ts'

// Each of these is a way of asking "what state is this invoice in" without asking payment.ts.
const ARITHMETIC = [
  /\bcancelledAt\s*[!=]==/,
  /\bpaidPaise\s*[<>]=?/,
  /\btotalPaise\s*-\s*/,
  /\bdueDate\s*[<>]/,
]

export function paymentRules() {
  const files = sourceFiles(['.ts', '.tsx'], { without: [HOME] })
    .filter((path) => path.startsWith('apps/magic/src/'))
    .filter((path) => !path.includes('.test.'))

  const offences = []
  for (const path of files) {
    readFileSync(path, 'utf8').split('\n').forEach((line, index) => {
      const code = line.replace(/\/\/.*$/, '')
      const hit = ARITHMETIC.find((pattern) => pattern.test(code))
      if (hit) offences.push({ path, line: index + 1, text: code.trim().slice(0, 72) })
    })
  }

  if (files.length === 0) {
    return [{ ok: false, lines: ['  RAN NOTHING  the payment-state rule looked at no file'] }]
  }

  if (offences.length > 0) {
    return [
      {
        ok: false,
        lines: [
          `  FAIL  only ${HOME} works out what an invoice is worth  (${files.length} files)`,
          ...offences.map(({ path, line, text }) => `        ${path}:${line} — ${text}`),
          '        ask paymentStateOf, balanceOf or isCancelled instead',
        ],
      },
    ]
  }

  return [{ ok: true, line: `  ok    only ${HOME} works out what an invoice is worth  (${files.length} files)` }]
}
