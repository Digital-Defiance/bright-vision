import { expect, test } from '@playwright/test'
import { assessGeneratedSpecLayers } from '../src/utils/specLayers'
import {
  assertOllamaForLlmE2e,
  ensureLlmE2eWorkspace,
  isLlmE2eEnabled,
} from './helpers/llmEnv'
import { primeLlmE2eApp, startLlmE2eSession } from './helpers/llmSession'
import { openTasks, selectTodoTemplate } from './helpers/session'
import {
  expectRequirementsPopulated,
  runGenerateSpecDialog,
  specGenTimeoutMs,
} from './helpers/specGenerate'

const SPEC_GEN_MS = specGenTimeoutMs()

// Job wait (SPEC_GEN_MS) + session/tabs/lint; must exceed playwright.llm.config default.
test.describe.configure({ mode: 'serial', timeout: SPEC_GEN_MS + 480_000 })

test.describe('Spec generate LLM (real Ollama + Vision API) @spec-gen', () => {
  test.skip(!isLlmE2eEnabled(), 'Run: yarn test:e2e:llm (E2E_LLM=1)')

  test.beforeAll(async () => {
    await assertOllamaForLlmE2e()
    ensureLlmE2eWorkspace()
  })

  test('generate spec produces EARS-shaped three layers', async ({ page }) => {
    await primeLlmE2eApp(page)
    await startLlmE2eSession(page, 180_000)
    await openTasks(page)

    await selectTodoTemplate(page, 'spec-driven')
    await page.getByTestId('todo-new').click()
    const newRow = page.getByText(/Task \d+/).first()
    await expect(newRow).toBeVisible({ timeout: 10_000 })
    await newRow.click()

    await expect(page.getByRole('button', { name: 'Generate spec' })).toBeEnabled({
      timeout: 15_000,
    })
    await page.getByRole('button', { name: 'Generate spec' }).click()
    const dialog = page.getByRole('dialog')
    await dialog
      .getByRole('textbox')
      .fill(
        'Feature: minimal health ping endpoint. Use REQ-001 and REQ-002 with WHEN and SHALL. Two numbered implementation tasks.'
      )

    await runGenerateSpecDialog(page, SPEC_GEN_MS)
    const requirements = await expectRequirementsPopulated(page, 60_000)

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

    await page.getByRole('tab', { name: /^Requirements/ }).click()
    const lintDone = page.waitForResponse(
      (res) =>
        res.request().method() === 'POST' &&
        res.url().includes('/lint-requirements') &&
        res.ok(),
      { timeout: 60_000 }
    )
    await page.getByTestId('todo-validate-ears').click()
    await lintDone
    const summary = page.getByTestId('ears-lint-summary')
    await expect(summary).toBeVisible({ timeout: 30_000 })
    const summaryText = await summary.innerText()
    if (!/EARS OK/i.test(summaryText)) {
      test.info().annotations.push({
        type: 'note',
        description: `EARS lint: ${summaryText}`,
      })
    }
  })
})
