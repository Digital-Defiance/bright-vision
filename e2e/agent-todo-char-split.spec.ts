import { expect, test } from '@playwright/test'
import { agentPlanTitleLooksValid } from './helpers/agentTodoFixture'
import { openTasks, startMockSession } from './helpers/session'

/**
 * Post-/agent path: char-split UpdateTodoList on disk → import-agent-plan on Tasks reload.
 */
test.describe('Agent todo char-split → Tasks title', () => {
  test('import from disk shows recovered task title, not [', async ({ page }) => {
    const importPlan = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/workspaces/todos/import-agent-plan') &&
        res.ok(),
      { timeout: 30_000 }
    )
    const todosListed = page.waitForResponse(async (res) => {
      if (res.request().method() !== 'GET' || !res.url().includes('/workspaces/todos')) return false
      if (res.url().includes('import-agent-plan')) return false
      if (!res.ok()) return false
      try {
        const body = (await res.json()) as { todos?: { title?: string }[] }
        return body.todos?.some((t) => /Explore the codebase/i.test(t.title ?? '')) ?? false
      } catch {
        return false
      }
    })

    await startMockSession(page, { scenario: 'agent-todo-char-split' })
    await openTasks(page)
    await importPlan
    await todosListed

    const taskButton = page.getByTestId('todo-panel').getByRole('button', {
      name: /Explore the codebase/,
    })
    await expect(taskButton).toBeVisible({ timeout: 15_000 })
    await taskButton.click()

    const titleField = page.getByLabel('Title')
    await expect(titleField).toHaveValue(/Explore the codebase/)
    expect(agentPlanTitleLooksValid(await titleField.inputValue())).toBe(true)

    await expect(page.getByTestId('todo-panel').getByRole('button', { name: '^\[$' })).toHaveCount(0)
  })
})
