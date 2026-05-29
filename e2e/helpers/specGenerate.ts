import { expect, type Page, type Response } from '@playwright/test'

/** Align with `LLM_SPEC_GEN_TIMEOUT_S` / pytest `spec_gen_timeout_s()`. */
export function specGenTimeoutMs(): number {
  const raw = process.env.LLM_SPEC_GEN_TIMEOUT_S ?? '600'
  const sec = Number(raw)
  return (Number.isFinite(sec) && sec > 0 ? sec : 600) * 1000
}

function isGenerateSpecJobPoll(res: Response): boolean {
  return (
    res.request().method() === 'GET' &&
    res.url().includes('/workspaces/todos/generate-spec/') &&
    res.ok()
  )
}

/** Wait until background generate-spec job reports completed or error (real Vision API). */
export async function waitForWorkspaceSpecGenerate(page: Page, timeoutMs = specGenTimeoutMs()) {
  const done = page.waitForResponse(
    async (res) => {
      if (!isGenerateSpecJobPoll(res)) return false
      try {
        const body = (await res.json()) as { status?: string; error?: string | null }
        return body.status === 'completed' || body.status === 'error'
      } catch {
        return false
      }
    },
    { timeout: timeoutMs }
  )
  return done
}

/** Click Run in generate dialog and wait for job completion + dialog close. */
export async function runGenerateSpecDialog(page: Page, timeoutMs = specGenTimeoutMs()) {
  const dialog = page.getByRole('dialog')
  const jobDone = waitForWorkspaceSpecGenerate(page, timeoutMs)
  await dialog.getByRole('button', { name: 'Run' }).click()
  const res = await jobDone
  const body = (await res.json()) as { status?: string; error?: string | null }
  if (body.status === 'error') {
    throw new Error(body.error || 'Spec generation failed')
  }
  await expect(dialog).toBeHidden({ timeout: 60_000 })
}

export async function expectRequirementsPopulated(
  page: Page,
  timeoutMs = 60_000
): Promise<string> {
  await expect
    .poll(
      async () => {
        const text = await page.getByLabel('Requirements (EARS-style)').inputValue()
        return /REQ-\d+/i.test(text) && /\bshall\b/i.test(text)
      },
      { timeout: timeoutMs }
    )
    .toBe(true)
  return page.getByLabel('Requirements (EARS-style)').inputValue()
}

export async function expectDesignPopulated(page: Page, timeoutMs = 60_000): Promise<string> {
  await expect
    .poll(
      async () => {
        const text = await page.getByLabel('Design').inputValue()
        return text.trim().length > 24
      },
      { timeout: timeoutMs }
    )
    .toBe(true)
  return page.getByLabel('Design').inputValue()
}

export async function expectTasksPopulated(page: Page, timeoutMs = 60_000): Promise<string> {
  await expect
    .poll(
      async () => {
        const text = await page.getByLabel('Implementation tasks').inputValue()
        return /^\s*[-*]\s*\[\s*[ xX]\s*\]\s*\d+\./m.test(text)
      },
      { timeout: timeoutMs }
    )
    .toBe(true)
  return page.getByLabel('Implementation tasks').inputValue()
}

/** Open wizard dialog on the active spec tab, optionally edit prompt, Run, wait for job. */
export async function runWizardGenerateSpecDialog(
  page: Page,
  opts?: { prompt?: string; timeoutMs?: number }
) {
  const timeoutMs = opts?.timeoutMs ?? specGenTimeoutMs()
  await page.getByTestId('todo-generate-spec-wizard').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  if (opts?.prompt !== undefined) {
    await dialog.getByRole('textbox').fill(opts.prompt)
  }
  await runGenerateSpecDialog(page, timeoutMs)
}

/** Legacy one-shot generate via **All layers** button. */
export async function runAllLayersGenerateSpecDialog(
  page: Page,
  prompt: string,
  timeoutMs = specGenTimeoutMs()
) {
  await page.getByTestId('todo-generate-spec-all').click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('Generate all spec layers')
  await dialog.getByRole('textbox').fill(prompt)
  await runGenerateSpecDialog(page, timeoutMs)
}
