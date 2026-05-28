import { expect, test } from '@playwright/test'
import { expectOptimisticSend, expectTurnIdle } from './helpers/chatSend'
import { assertOllamaForLlmE2e, isLlmE2eEnabled } from './helpers/llmEnv'
import { ensureHelloLlmE2eWorkspace } from './helpers/fixtureWorkspaces'
import { openLlmChat, primeLlmE2eApp, startLlmE2eSession } from './helpers/llmSession'
import { settleTurnAfterReply } from './helpers/llmTurn'
import { workspaceHasAgentTodoMagic } from './helpers/todoAgentFile'

test.describe.configure({ mode: 'serial', timeout: 900_000 })

test.describe('LLM UpdateTodoList @todo', () => {
  test.skip(!isLlmE2eEnabled(), 'Run: yarn test:e2e:llm')

  test.beforeAll(async () => {
    await assertOllamaForLlmE2e()
    ensureHelloLlmE2eWorkspace()
  })

  test('writes magic task to agent todo.txt', async ({ page }) => {
    const workspace = ensureHelloLlmE2eWorkspace()
    await primeLlmE2eApp(page, { workingDir: workspace })
    await startLlmE2eSession(page)
    await openLlmChat(page)

    const prompt = [
      'Use the UpdateTodoList tool exactly once with tasks as a JSON array containing one object:',
      `{"task": "${E2E_TODO_MAGIC}", "done": false, "current": true}.`,
      'Do not use shell commands or edit other files.',
    ].join(' ')

    await page.getByTestId('chat-input').fill(prompt)
    await page.getByTestId('chat-send').click()
    await expectOptimisticSend(page, prompt)
    await settleTurnAfterReply(page, 360_000)

    await expect
      .poll(() => workspaceHasAgentTodoMagic(workspace), { timeout: 30_000 })
      .toBe(true)
    await expectTurnIdle(page, 30_000)
  })
})
