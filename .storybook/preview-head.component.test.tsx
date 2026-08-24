// The loud-failure panel is a browser file that no other check reads. It exists because a
// preview bundle that fails to load leaves nothing behind to draw Storybook's own error
// screens, and the story then spins for ever with the reason only in a console nobody has
// open. That cost a session once. This is the test that says it still works.

import { describe, expect, it } from 'vitest'

import panelHtml from './preview-head.html?raw'

function loadThePanelScript() {
  const source = panelHtml.replace(/^[\s\S]*?<script>/, '').replace(/<\/script>[\s\S]*$/, '')
  const element = document.createElement('script')
  element.textContent = source
  document.body.appendChild(element)
}

describe('the panel that shows a story failing to load', () => {
  it('puts the browser error on the screen where it can be read', () => {
    loadThePanelScript()

    window.dispatchEvent(
      new ErrorEvent('error', {
        message: "The requested module does not provide an export named 'default'",
        filename: 'http://localhost:6006/node_modules/react/index.js',
        lineno: 2,
      }),
    )

    const panel = document.querySelector('[role="alert"]')
    expect(panel).not.toBeNull()
    expect(panel!.checkVisibility()).toBe(true)
    expect(panel!.textContent).toContain("does not provide an export named 'default'")
    expect(panel!.textContent).toContain('node_modules/react/index.js')
  })
})
