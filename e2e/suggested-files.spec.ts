import { expect, test } from '@playwright/test'
import { expectOptimisticSend } from './helpers/chatSend'
import { suggestedFilesTurnEvents } from './helpers/fixtures'
import { openChat, startMockSession } from './helpers/session'

test.describe('Suggested files tray (roadmap #32)', () => {
  test.beforeEach(async ({ page }) => {
    await startMockSession(page, { messageTurns: [suggestedFilesTurnEvents()] })
    await openChat(page)
  })

  test('shows tray after assistant lists paths', async ({ page }) => {
    await page.getByTestId('chat-input').fill('Which files should I add?')
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, 'Which files should I add?')

    const tray = page.getByTestId('suggested-files-tray')
    await expect(tray).toBeVisible({ timeout: 15_000 })
    await expect(tray).toContainText('src/suggested-a.ts')
    await expect(tray).toContainText('src/suggested-b.ts')
  })

  test('queue /add enqueues separate user messages', async ({ page }) => {
    await page.getByTestId('chat-input').fill('list files')
    await page.getByTestId('chat-send').click()

    await expect(page.getByTestId('suggested-files-tray')).toBeVisible({ timeout: 15_000 })
    await page.getByTestId('suggested-files-queue-adds').click()

    await expect(page.getByText('/add src/suggested-a.ts')).toBeVisible()
    await expect(page.getByText('/add src/suggested-b.ts')).toBeVisible()
  })
})
