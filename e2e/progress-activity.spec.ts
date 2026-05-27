import { expect, test } from '@playwright/test'
import { openChat, startMockSession } from './helpers/session'

test.describe('Activity bar progress (core progress SSE)', () => {
  test('shows determinate percent from progress events', async ({ page }) => {
    // One progress frame + hold: scanProgressTurnEvents() also sends 100% and tokens
    // within ~80ms, which clears the % label before Playwright can assert it.
    await startMockSession(page, {
      messageTurns: [
        [
          {
            type: 'progress',
            label: 'Scanning repo',
            current: 40,
            total: 100,
            message: '40/100',
          },
        ],
      ],
      messageDelayMs: 4_000,
    })
    await openChat(page)

    await page.getByTestId('chat-input').fill('scan the repo')
    await page.getByTestId('chat-send').click()

    const activity = page.getByTestId('vision-activity')
    await expect(activity).toBeVisible({ timeout: 10_000 })
    await expect(activity).toHaveAttribute('data-indeterminate', 'false')
    await expect(activity.getByText('40%')).toBeVisible({ timeout: 8_000 })
    await expect(activity.getByText('Scanning repo')).toBeVisible()
    await expect(activity.getByText('40/100')).toBeVisible()
  })
})
