import { expect, test } from '@playwright/test'
import { openSettings, startMockSession } from './helpers/session'

test.describe('Mobile alerts / ntfy (roadmap #42)', () => {
  test('Settings section enables topic and test ping invokes Tauri', async ({ page }) => {
    const pushes: unknown[] = []

    await startMockSession(page, {
      tauri: {
        handlers: {
          ntfy_send_push: async (args) => {
            pushes.push(args)
            return null
          },
        },
      },
    })
    await openSettings(page)

    const section = page.getByTestId('settings-ntfy-alerts')
    await expect(section).toBeVisible()
    await page.getByTestId('settings-ntfy-enabled').click()

    await page.getByTestId('settings-ntfy-test').click()
    await expect.poll(() => pushes.length).toBe(1)

    const payload = pushes[0] as { title?: string; message?: string; topic?: string }
    expect(String(payload.title ?? '')).toMatch(/BrightVision/i)
    expect(String(payload.message ?? '')).toMatch(/Test notification/i)
    expect(String(payload.topic ?? '').length).toBeGreaterThan(0)
  })
})
