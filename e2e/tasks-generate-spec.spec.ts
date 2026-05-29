import { expect, test } from '@playwright/test'
import { sampleTodoStore } from './helpers/fixtures'
import { openTasks, startMockSession } from './helpers/session'
import { assessGeneratedSpecLayers } from '../src/utils/specLayers'

test.describe('Tasks generate/refine spec layers (roadmap #18)', () => {
  test.beforeEach(async ({ page }) => {
    await startMockSession(page, { initialTodos: sampleTodoStore() })
    await openTasks(page)
    await expect(page.getByTestId('todo-new')).toBeEnabled({ timeout: 15_000 })
    await expect(page.getByText('First task')).toBeVisible({ timeout: 10_000 })
  })

  test('generate spec fills requirements, design, and tasks tabs', async ({ page }) => {
    await page.getByText('First task').click()
    await page.getByRole('button', { name: 'Generate spec' }).click()
    await page.getByRole('dialog').getByRole('textbox').fill('E2E ping counter feature')
    await page.getByRole('button', { name: 'Run' }).click()

    await expect(page.getByText('REQ-001')).toBeVisible({ timeout: 15_000 })

    const requirements = await page
      .getByLabel('Requirements (EARS-style)')
      .inputValue()
    await page.getByRole('tab', { name: 'Design' }).click()
    const design = await page.getByLabel('Design').inputValue()
    await page.getByRole('tab', { name: 'Tasks' }).click()
    const tasksMd = await page.getByLabel('Implementation tasks').inputValue()

    const assessment = assessGeneratedSpecLayers({
      requirements,
      design,
      tasks_md: tasksMd,
    })
    expect(assessment.ok, assessment.issues.join('; ')).toBe(true)
  })

  test('refine spec keeps sane layers', async ({ page }) => {
    await page.getByText('First task').click()
    await page.getByRole('button', { name: 'Refine spec' }).click()
    await page.getByRole('dialog').getByRole('textbox').fill('Align tasks with REQ-002')
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.getByText('REQ-002')).toBeVisible({ timeout: 15_000 })
    await page.getByTestId('todo-validate-ears').click()
    await expect(page.getByTestId('ears-lint-summary')).toContainText('EARS OK', {
      timeout: 10_000,
    })
  })

  test('ears_blocked shows warning snackbar', async ({ page }) => {
    await page.route(
      (url) => /\/workspaces\/todos\/generate-spec\//.test(url.pathname),
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            status: 'completed',
            requirements: '### REQ-001\n**WHEN** x\n**THE** system shows y.\n',
            design: '## Design',
            tasks_md: '- [ ] 1. Step (depends: none)',
            raw: '',
            ears_blocked: true,
            ears_issues: [{ code: 'EARS_NO_SHALL', message: 'missing SHALL', severity: 'error' }],
            item: null,
          }),
        })
      }
    )
    await page.route(
      (url) => /\/workspaces\/todos\/[^/]+\/generate-spec$/.test(url.pathname),
      async (route) => {
        await route.fulfill({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ job_id: 'job-ears-blocked', status: 'pending', todo_id: 'task-a' }),
        })
      }
    )

    await page.getByText('First task').click()
    await page.getByRole('button', { name: 'Generate spec' }).click()
    await page.getByRole('button', { name: 'Run' }).click()
    await expect(page.getByText(/not saved|EARS error/i)).toBeVisible({ timeout: 15_000 })
  })
})
