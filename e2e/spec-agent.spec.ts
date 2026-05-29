import { expect, test } from '@playwright/test'
import { sampleTodoStore } from './helpers/fixtures'
import { startMockSession } from './helpers/session'

test.describe('Spec agent rail (roadmap #20 E6)', () => {
  test.beforeEach(async ({ page }) => {
    const store = sampleTodoStore()
    store.activeId = 'task-a'
    await startMockSession(page, { initialTodos: store })
  })

  test('Spec tab shows panel and active task chip', async ({ page }) => {
    await page.getByTestId('nav-spec').click()
    await expect(page.getByTestId('spec-agent-panel')).toBeVisible()
    await expect(page.getByTestId('spec-agent-active-task')).toContainText('First task')
    await expect(page.getByTestId('spec-agent-empty')).toBeVisible()
  })

  test('Spec send posts message with spec_focus', async ({ page }) => {
    let messageBody: { spec_focus?: boolean; preproc?: boolean } = {}
    await page.route('**/sessions/*/messages', async (route) => {
      if (route.request().method() === 'POST') {
        messageBody = route.request().postDataJSON() as typeof messageBody
        const body = `data: ${JSON.stringify({ type: 'user_message', text: 'hello' })}\n\n`
        const done = `data: ${JSON.stringify({ type: 'done', assistant_text: 'Spec reply' })}\n\n`
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
          body: body + `data: ${JSON.stringify({ type: 'token', text: 'Spec ' })}\n\n` + `data: ${JSON.stringify({ type: 'token', text: 'reply' })}\n\n` + done,
        })
        return
      }
      await route.continue()
    })

    await page.getByTestId('nav-spec').click()
    await page.getByTestId('spec-agent-input').fill('Tighten REQ-001 wording')
    await page.getByTestId('spec-agent-send').click()

    await expect.poll(() => messageBody.spec_focus).toBe(true)
    expect(messageBody.preproc).toBe(false)
    await expect(page.getByTestId('spec-agent-assistant')).toContainText('Spec reply', {
      timeout: 15_000,
    })
  })
})
