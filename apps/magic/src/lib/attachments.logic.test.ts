import { describe, expect, test } from 'vitest'

import {
  LARGEST_BYTES,
  NOT_ALLOWED,
  TOO_LARGE,
  kindOf,
  refusalFor,
  refusalSummary,
  sizeText,
  sortFiles,
} from './attachments'

describe('what may be attached', () => {
  test('every format the product document allows is taken, in either case', () => {
    expect(kindOf('rough-invoice-photo.JPG')).toBe('Photo')
    expect(kindOf('scan.jpeg')).toBe('Photo')
    expect(kindOf('shelf.png')).toBe('Photo')
    expect(kindOf('delivery-note.heic')).toBe('Photo')
    expect(kindOf('label.webp')).toBe('Photo')
    expect(kindOf('site-survey.tiff')).toBe('Photo')
    expect(kindOf('purchase-order.pdf')).toBe('PDF')
    expect(kindOf('rate-contract.doc')).toBe('Word')
    expect(kindOf('rate-contract.docx')).toBe('Word')
    expect(kindOf('price-list.xls')).toBe('Spreadsheet')
    expect(kindOf('price-list.xlsx')).toBe('Spreadsheet')
  })

  test('executables, archives and macro-enabled files are refused', () => {
    expect(refusalFor('setup.exe', 10)).toBe(NOT_ALLOWED)
    expect(refusalFor('run.bat', 10)).toBe(NOT_ALLOWED)
    expect(refusalFor('backup-2026.zip', 10)).toBe(NOT_ALLOWED)
    expect(refusalFor('archive.rar', 10)).toBe(NOT_ALLOWED)
    expect(refusalFor('rates.xlsm', 10)).toBe(NOT_ALLOWED)
    expect(refusalFor('letter.docm', 10)).toBe(NOT_ALLOWED)
  })

  // The extension is what a person can see. `File.type` is the operating system's guess and it
  // comes back empty for HEIC on Windows, which would refuse an ordinary photo for being
  // nothing at all.
  test('a file with no extension is refused rather than guessed at', () => {
    expect(kindOf('README')).toBeNull()
    expect(refusalFor('README', 10)).toBe(NOT_ALLOWED)
  })

  test('ten megabytes is the cap, and the byte on either side of it decides', () => {
    expect(refusalFor('scan.pdf', LARGEST_BYTES)).toBeNull()
    expect(refusalFor('scan.pdf', LARGEST_BYTES + 1)).toBe(TOO_LARGE)
  })

  // A 40 MB executable is refused for being an executable, which is the thing about it that is
  // still true after somebody compresses it.
  test('type is asked before size', () => {
    expect(refusalFor('backup-2026.zip', LARGEST_BYTES + 1)).toBe(NOT_ALLOWED)
  })
})

describe('picking several at once', () => {
  const files = [
    { name: 'rough-invoice-photo.jpg', size: 2_100_000 },
    { name: 'backup-2026.zip', size: 54_000_000 },
    { name: 'purchase-order.pdf', size: 340_000 },
    { name: 'full-batch-scan.pdf', size: 14_000_000 },
  ]

  test('the allowed ones go on and the rest are reported', () => {
    const { taking, refused } = sortFiles(files)
    expect(taking.map((file) => file.name)).toEqual(['rough-invoice-photo.jpg', 'purchase-order.pdf'])
    expect(refused).toEqual([
      { name: 'backup-2026.zip', reason: NOT_ALLOWED },
      { name: 'full-batch-scan.pdf', reason: TOO_LARGE },
    ])
  })

  test('the report counts the files and names every distinct reason', () => {
    expect(refusalSummary(sortFiles(files).refused)).toBe(
      `2 file(s) could not be attached. ${NOT_ALLOWED} ${TOO_LARGE}`,
    )
  })

  // Five bad types are one sentence, not five.
  test('one reason shared by several files is said once', () => {
    const refused = sortFiles([
      { name: 'a.zip', size: 1 },
      { name: 'b.exe', size: 1 },
    ]).refused
    expect(refusalSummary(refused)).toBe(`2 file(s) could not be attached. ${NOT_ALLOWED}`)
  })

  test('nothing refused says nothing at all', () => {
    expect(refusalSummary(sortFiles([{ name: 'a.pdf', size: 1 }]).refused)).toBeNull()
  })
})

describe('the size on a row', () => {
  test('reads the way a file manager writes it', () => {
    expect(sizeText(340)).toBe('340 B')
    expect(sizeText(340 * 1024)).toBe('340 KB')
    expect(sizeText(2.1 * 1024 * 1024)).toBe('2.1 MB')
    expect(sizeText(LARGEST_BYTES)).toBe('10.0 MB')
  })
})
