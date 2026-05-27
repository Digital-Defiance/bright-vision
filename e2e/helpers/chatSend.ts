import { expect, type Page } from '@playwright/test'

/** After Send/Queue: input clears and user bubble appears before SSE may finish. */
export async function expectOptimisticSend(page: Page, text: string) {
  await expect(page.getByTestId('chat-input')).toHaveValue('', { timeout: 5_000 })
  await expect(
    page.getByTestId('chat-message-user').filter({ hasText: text })
  ).toBeVisible({ timeout: 5_000 })
}

/** Turn finished: not busy, activity hidden, ready to type (Send stays disabled until input is non-empty). */
export async function expectTurnIdle(page: Page, timeoutMs = 60_000) {
  await expect(page.getByTestId('chat-stop-turn')).toHaveCount(0, { timeout: timeoutMs })
  await expect(page.getByTestId('vision-activity')).toHaveCount(0, { timeout: timeoutMs })
  await expect(page.getByTestId('chat-input')).toBeEnabled({ timeout: timeoutMs })
}
