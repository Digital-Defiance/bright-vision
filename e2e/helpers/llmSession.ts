import { expect, type Page } from '@playwright/test'
import {
  buildLlmE2eConfig,
  resolveOllamaTagWithFallback,
  resolveVisionModel,
  visionModelFromTag,
} from './llmEnv'
import { openChat } from './session'
import { E2E_CONFIG_STORAGE_KEY } from './testConfig'

export type LlmE2eConfigOverrides = Partial<ReturnType<typeof buildLlmE2eConfig>>

/** Prime localStorage and resolve model (same as hello-llm). */
export async function primeLlmE2eApp(
  page: Page,
  overrides: LlmE2eConfigOverrides = {}
): Promise<ReturnType<typeof buildLlmE2eConfig>> {
  const cfg = {
    ...buildLlmE2eConfig(),
    model:
      overrides.model ||
      resolveVisionModel() ||
      visionModelFromTag(await resolveOllamaTagWithFallback()),
    ...overrides,
  }
  await page.addInitScript(
    ([key, config]) => {
      localStorage.setItem('vision-welcome-dismissed', '1')
      localStorage.setItem(key, JSON.stringify(config))
    },
    [E2E_CONFIG_STORAGE_KEY, cfg] as const
  )
  return cfg
}

/** Terminal → Start, wait for live session. */
export async function startLlmE2eSession(page: Page, sessionTimeoutMs = 120_000) {
  await page.goto('/')
  await page.getByTestId('nav-terminal').click()
  await page.getByTestId('terminal-start').click()
  await expect(page.getByTestId('session-status')).toContainText('Session active', {
    timeout: sessionTimeoutMs,
  })
}

export async function openLlmChat(page: Page) {
  await openChat(page)
}
