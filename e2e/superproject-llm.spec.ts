import { expect, test } from '@playwright/test'
import { expectOptimisticSend, expectTurnIdle } from './helpers/chatSend'
import {
  assertOllamaForLlmE2e,
  isLlmE2eEnabled,
  isSuperprojectLlmEnabled,
  superprojectLlmReadmeRel,
  superprojectLlmWorkspace,
  SUPERPROJECT_README_HEADING,
} from './helpers/llmEnv'
import { expectLatestAssistantReply } from './helpers/llmChat'
import { openLlmChat, primeLlmE2eApp, startLlmE2eSession } from './helpers/llmSession'
import { settleTurnAfterReply } from './helpers/llmTurn'

test.describe.configure({ mode: 'serial', timeout: 1_200_000 })

test.describe('LLM superproject workspace @superproject', () => {
  test.skip(!isLlmE2eEnabled(), 'Run: yarn test:e2e:llm')
  test.skip(!isSuperprojectLlmEnabled(), 'Run with E2E_SUPERPROJECT_LLM=1 (slow repo map)')

  test.beforeAll(async () => {
    await assertOllamaForLlmE2e()
  })

  test('reads heading from bright_vision_core/README.md in repo root workspace', async ({ page }) => {
    const workspace = superprojectLlmWorkspace()
    const rel = superprojectLlmReadmeRel()
    await primeLlmE2eApp(page, { workingDir: workspace })
    await startLlmE2eSession(page, 300_000)
    await openLlmChat(page)

    const addCmd = `/add ${rel}`
    await page.getByTestId('chat-input').fill(addCmd)
    await page.getByTestId('chat-send').click()
    await expect(page.getByTestId('chat-tool-output')).toContainText(`Added ${rel}`, {
      timeout: 300_000,
    })
    await expectTurnIdle(page, 300_000)

    const question = [
      `Using only ${rel}, what is the markdown H1 heading (text after #)?`,
      `Reply with only: ${SUPERPROJECT_README_HEADING}`,
    ].join(' ')
    await page.getByTestId('chat-input').fill(question)
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, question)
    await expectLatestAssistantReply(page, new RegExp(SUPERPROJECT_README_HEADING, 'i'), 480_000)
    await settleTurnAfterReply(page, 180_000)
  })
})
