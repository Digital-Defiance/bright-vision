import { expect, test } from '@playwright/test'
import { expectOptimisticSend } from './helpers/chatSend'
import { cumulativeStreamTurnEvents, interleavedToolTurnEvents } from './helpers/fixtures'
import { openChat, startMockSession } from './helpers/session'

test.describe('Stream chat (roadmap #1, #8 — order & dedupe)', () => {
  test('tool output appears inline before later assistant text', async ({ page }) => {
    await startMockSession(page, { messageTurns: [interleavedToolTurnEvents()] })
    await openChat(page)

    await page.getByTestId('chat-input').fill('summarize roadmap')
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, 'summarize roadmap')

    await expect(page.getByTestId('chat-message-assistant').first()).toContainText(
      'Reading roadmap',
      { timeout: 15_000 }
    )

    const roadmapTool = page.getByTestId('chat-tool-output').filter({
      hasText: 'Added docs/ROADMAP.md',
    })
    await expect(roadmapTool).toBeVisible()
    await expect(page.getByTestId('chat-message-assistant').last()).toContainText(
      'In Progress'
    )

    const order = await page
      .locator(
        '[data-testid="chat-message-assistant"], [data-testid="chat-tool-output"]'
      )
      .evaluateAll((nodes) =>
        nodes.map((n) => n.getAttribute('data-testid') ?? '')
      )
    const firstTool = order.indexOf('chat-tool-output')
    const lastAssistant = order.lastIndexOf('chat-message-assistant')
    expect(firstTool).toBeGreaterThanOrEqual(0)
    expect(lastAssistant).toBeGreaterThan(firstTool)
  })

  test('cumulative token stream does not double words in assistant bubble', async ({
    page,
  }) => {
    await startMockSession(page, { messageTurns: [cumulativeStreamTurnEvents()] })
    await openChat(page)

    await page.getByTestId('chat-input').fill('read roadmap status')
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, 'read roadmap status')

    const assistant = page.getByTestId('chat-message-assistant').first()
    await expect(assistant).toContainText('In Progress', { timeout: 15_000 })
    await expect(assistant).toContainText('Workspace roadmap')

    const text = await assistant.innerText()
    expect(text).not.toMatch(/In\s+In\b/)
    expect(text).not.toMatch(/Progress\s+Progress\b/)
    expect(text).not.toMatch(/Workspace\s+Workspace\b/)
    expect(text).not.toMatch(/roadmap\s+roadmap\b/i)
  })
})
