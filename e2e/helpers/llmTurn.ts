import { expect, type Page } from '@playwright/test'

/** Dismiss confirm dialogs that block turn completion. */
export async function dismissConfirmIfPresent(page: Page) {
  const no = page.getByRole('button', { name: 'No' })
  if (await no.count()) {
    await no.first().click()
  }
}

/** Wait until stop button clears and chat is idle (handles trailing confirms). */
export async function settleTurnAfterReply(page: Page, timeoutMs = 180_000) {
  await expect
    .poll(
      async () => {
        await dismissConfirmIfPresent(page)
        const stop = await page.getByTestId('chat-stop-turn').count()
        const activity = await page.getByTestId('vision-activity').count()
        const inputEnabled = await page.getByTestId('chat-input').isEnabled()
        return stop === 0 && activity === 0 && inputEnabled
      },
      { timeout: timeoutMs, intervals: [400, 800, 1500] }
    )
    .toBe(true)
}
