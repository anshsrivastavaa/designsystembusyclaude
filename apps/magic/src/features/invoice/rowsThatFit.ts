import { useEffect, useState, type RefObject } from 'react'

// How many rows the item grid should show, measured rather than assumed.
//
// Its own file because it is its own thing, and because getting it wrong is quiet: the grid
// looks fine and is either short of the bottom of the page or growing without end. Three
// wrong answers are recorded below as the reasons for the shape of the right one.

/** Whatever actually does the scrolling above this grid, or the document if nothing does.
 *
 * Asked for by BEHAVIOUR rather than by tag. Looking for a `<main>` was tried first and made
 * the grid refuse to fill itself anywhere that tag was absent — which included its own
 * component test, where it silently padded nothing and the test read as a real failure. */
function scrollingAncestorOf(node: HTMLElement): HTMLElement {
  for (let up = node.parentElement; up !== null; up = up.parentElement) {
    const travels = getComputedStyle(up).overflowY
    if (travels === 'auto' || travels === 'scroll') return up
  }
  return document.documentElement
}

/** The number of rows that fits the room the page has left, never fewer than one. */
export function rowsThatFit(rowsArea: HTMLElement): number {
  const rowHeight = Number.parseFloat(getComputedStyle(rowsArea).getPropertyValue('--row-h'))
  if (!Number.isFinite(rowHeight) || rowHeight <= 0) return 1

  const screen = scrollingAncestorOf(rowsArea)

  // HOW MUCH TALLER OR SHORTER THE ROWS MAY BE FOR THE SCREEN TO EXACTLY FIT.
  //
  // Not "the distance to the bottom of the window", which was the first answer and was
  // wrong: it ignores the charges and the breakdown sitting UNDER the grid, so a blank
  // invoice filled past the bottom and the page scrolled with nothing on it.
  //
  // This asks the question the other way round and never has to know what is below: the
  // gap between the bottom of the screen's content and the bottom of the screen itself is
  // exactly the room the rows may take — negative when the page overflows, positive when
  // it has slack, whatever else is sitting down there.
  //
  // Measured off the CONTENT, not off scrollHeight. scrollHeight is never smaller than
  // clientHeight, so it reports zero slack for a page that half-fits as well as for one
  // that fits exactly — the first version of this only ever shrank, and a blank invoice
  // settled at two rows and stayed there.
  // The LOWEST edge of anything in the scroller, not its first child. `firstElementChild`
  // was tried and is <head> when the scroller is the document itself — a box with no
  // height, so the grid read the whole page as empty and grew without stopping.
  // ANYTHING PINNED IS NOT CONTENT. A sticky action bar is a child of the screen whose rect
  // sits at the bottom of the window whatever the page is doing — so it always looked as though
  // the content reached the floor, the grid padded nothing, and a blank invoice showed three
  // rows. What we are measuring is where the content ENDS, and a thing that does not travel
  // with the content cannot answer that.
  const children = ([...screen.children] as HTMLElement[]).filter((child) => {
    const travels = getComputedStyle(child).position
    return travels !== 'sticky' && travels !== 'fixed' && travels !== 'absolute'
  })
  if (children.length === 0) return 1
  // SCROLL TAKEN OUT. Every one of these rects moves up as the page is scrolled, while the
  // screen's own box does not — so the same page measured after scrolling looked as though it
  // had gained exactly as much room as it had travelled, and the grid grew a row for every row
  // you scrolled past. Adding scrollTop back puts both sides in the same coordinates.
  const contentBottom =
    Math.max(...children.map((child) => child.getBoundingClientRect().bottom)) + screen.scrollTop
  // The bottom of what the scroller can SHOW, which is its top plus its client height —
  // not the bottom of its own box. For the document element those are different numbers:
  // its box is as short as the page's content, so reading the box said "no room" on a page
  // that was mostly empty.
  const floorOfTheScreen =
    screen.getBoundingClientRect().top +
    screen.clientHeight -
    Number.parseFloat(getComputedStyle(screen).paddingBottom)
  const slack = floorOfTheScreen - contentBottom
  const spare = rowsArea.clientHeight + slack
  return Math.max(1, Math.floor(spare / rowHeight))
}

/**
 * How many rows fit, kept up to date. Its own hook because the grid was over its line and this
 * is genuinely separate: the grid draws a table, this measures the room around it.
 *
 * Re-measured when the window changes and when the card moves — a party card that grows a line
 * pushes the grid down and the answer moves with it. v2 recounts on exactly these two, plus a
 * density change, which arrives through the same resize.
 */
export function useRowsThatFit(card: RefObject<HTMLElement | null>, rowsArea: RefObject<HTMLElement | null>): number {
  const [visibleRows, setVisibleRows] = useState(1)

  useEffect(() => {
    const outer = card.current
    const area = rowsArea.current
    if (!outer || !area) return

    const measure = () => setVisibleRows(rowsThatFit(area))
    measure()

    const watcher = new ResizeObserver(measure)
    watcher.observe(outer)
    window.addEventListener('resize', measure)
    return () => {
      watcher.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [card, rowsArea])

  return visibleRows
}
