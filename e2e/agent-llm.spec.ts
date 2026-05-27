import { expect, test } from '@playwright/test'
import { expectOptimisticSend, expectTurnIdle } from './helpers/chatSend'
import {
  assertOllamaForLlmE2e,
  ensureLlmE2eWorkspace,
  isLlmE2eEnabled,
} from './helpers/llmEnv'
import { openLlmChat, primeLlmE2eApp, startLlmE2eSession } from './helpers/llmSession'

test.describe.configure({ mode: 'serial', timeout: 420_000 })

const AGENT_PROMPT =
  '/agent Reply with exactly: hello from agent e2e. Do not run shell commands, do not edit files, do not use tools.'

test.describe('Agent slash (real Ollama + Vision API)', () => {
  test.skip(!isLlmE2eEnabled(), 'Run: yarn test:e2e:llm (sets E2E_LLM=1 and E2E_OLLAMA_MODEL)')

  test.beforeAll(async () => {
    await assertOllamaForLlmE2e()
    ensureLlmE2eWorkspace()
  })

  test('/agent turn completes without verbose AttributeError', async ({ page }) => {
    const cfg = await primeLlmE2eApp(page)
    await startLlmE2eSession(page)
    await openLlmChat(page)

    await page.getByTestId('chat-input').fill(AGENT_PROMPT)
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, AGENT_PROMPT)

    await expect(page.getByText(/object has no attribute 'verbose'/i)).toHaveCount(0, {
      timeout: 30_000,
    })
    await expect(page.getByText(/Unable to complete agent.*verbose/i)).toHaveCount(0, {
      timeout: 30_000,
    })

    const assistant = page.getByTestId('chat-message-assistant').first()
    const activity = page.getByTestId('vision-activity')
    try {
      await expect(assistant).toBeVisible({ timeout: 360_000 })
    } catch {
      const activityText = (await activity.innerText().catch(() => '')).trim()
      const toolText = await page
        .getByTestId('chat-tool-output')
        .allInnerTexts()
        .catch(() => [])
      throw new Error(
        `No assistant message within 360s. Activity: ${activityText || '(none)'}\n` +
          `Tool output: ${toolText.join(' | ') || '(none)'}\n` +
          `Ollama: ${cfg.ollamaApiBase} · model: ${cfg.model}`
      )
    }

    const reply = (await assistant.innerText()).trim()
    expect(reply.length, 'assistant reply should not be empty').toBeGreaterThan(3)
    expect(reply.toLowerCase()).not.toContain("object has no attribute 'verbose'")

    await expect(page.getByText(/Turn stalled/i)).toHaveCount(0)
    await expectTurnIdle(page, 120_000)
    await page.getByTestId('chat-input').fill('agent follow-up probe')
    await expect(page.getByTestId('chat-send')).toBeEnabled()
  })
})
