import { expect, test } from '@playwright/test'
import { expectOptimisticSend } from './helpers/chatSend'
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
import { settleTurnAfterReply } from './helpers/llmTurn'

test.describe.configure({ mode: 'serial', timeout: 900_000 })

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
    await settleTurnAfterReply(page, 360_000)

    const heavyPrompt =
      'Provide an architecture review for this app with migration risks and security considerations.'
    await page.getByTestId('chat-input').fill(heavyPrompt)
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, heavyPrompt)
    await expect(page.getByTestId('model-router-chip')).toContainText('Engineer', {
      timeout: 240_000,
    })
    await expectLatestAssistantReply(page, /architecture|security|migration|response/i, 360_000)
    await settleTurnAfterReply(page, 360_000)
  })
})

