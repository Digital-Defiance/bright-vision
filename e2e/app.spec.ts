import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('vision-welcome-dismissed', '1'))
  await page.reload()
})

test('shows chat by default', async ({ page }) => {
  await expect(page.getByTestId('nav-chat')).toBeVisible()
})

test('git tab shows web hint without Tauri', async ({ page }) => {
  await page.getByTestId('nav-git').click()
  await expect(page.getByTestId('git-panel')).toBeVisible()
  await expect(page.getByTestId('git-panel-web-hint')).toContainText('desktop app')
})

test('settings tab loads', async ({ page }) => {
  await page.getByTestId('nav-settings').click()
  await expect(page.getByLabel('Prompt before commit')).toBeVisible()
  await expect(page.getByLabel('Auto-stage edits after turn')).toBeVisible()
})
