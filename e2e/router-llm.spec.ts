import { expect, test, type Page } from '@playwright/test'
import { expectOptimisticSend, expectTurnIdle } from './helpers/chatSend'
import {
  assertOllamaForLlmE2e,
  ensureOllamaModelPulled,
  ensureLlmE2eWorkspace,
  isLlmE2eEnabled,
  isRouterLlmE2eEnabled,
  resolveRouterModelTags,
} from './helpers/llmEnv'
import { expectLatestAssistantReply } from './helpers/llmChat'
import { openLlmChat, primeLlmE2eApp, startLlmE2eSession } from './helpers/llmSession'

test.describe.configure({ mode: 'serial', timeout: 900_000 })

async function dismissConfirmIfPresent(page: Page) {
  // Some models still attempt workspace edits for "rename" prompts.
  const no = page.getByRole('button', { name: 'No' })
  if (await no.count()) {
    await no.first().click()
  }
}

async function settleTurnAfterReply(page: Page, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    await dismissConfirmIfPresent(page)
    if ((await page.getByTestId('chat-stop-turn').count()) === 0) break
    await page.waitForTimeout(400)
  }
  await expectTurnIdle(page, timeoutMs)
}

test.describe('LLM auto-router @router', () => {
  test.skip(!isLlmE2eEnabled(), 'Run with E2E_LLM=1')
  test.skip(!isRouterLlmE2eEnabled(), 'Run with E2E_MODEL_ROUTER=1')

  test.beforeAll(async () => {
    await assertOllamaForLlmE2e()
    ensureLlmE2eWorkspace()
    const { fastTag, heavyTag } = resolveRouterModelTags()
    if (!fastTag) throw new Error('Router e2e requires FAST_MODEL or E2E_FAST_MODEL')
    await ensureOllamaModelPulled(fastTag)
    await ensureOllamaModelPulled(heavyTag || fastTag)
  })

  test('routes lightweight prompt to fast and architecture prompt to heavy', async ({ page }) => {
    await primeLlmE2eApp(page)
    await startLlmE2eSession(page)
    await openLlmChat(page)

    const fastPrompt =
      'Suggest a better button label than "Start" in one sentence only. No code blocks, no file edits.'
    await page.getByTestId('chat-input').fill(fastPrompt)
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, fastPrompt)
    await expect(page.getByTestId('model-router-chip')).toContainText('Fighter pilot', {
      timeout: 240_000,
    })
    await expectLatestAssistantReply(page, /begin|start|run|button|label|response/i, 360_000)
    await settleTurnAfterReply(page, 180_000)

    const heavyPrompt =
      'Provide an architecture review for this app with migration risks and security considerations.'
    await page.getByTestId('chat-input').fill(heavyPrompt)
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, heavyPrompt)
    await expect(page.getByTestId('model-router-chip')).toContainText('Engineer', {
      timeout: 240_000,
    })
    await expectLatestAssistantReply(page, /architecture|security|migration|response/i, 360_000)
    await settleTurnAfterReply(page, 180_000)
  })
})

