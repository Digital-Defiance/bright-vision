import { expect, test } from '@playwright/test'
import { proposedEditTurnEvents } from './helpers/fixtures'
import { openChat, startMockSession } from './helpers/session'

test.describe('Proposed edits apply (roadmap #2)', () => {
  test('Apply to workspace writes SEARCH/REPLACE via Tauri', async ({ page }) => {
    const writes: { path?: string; content?: string }[] = []

    await startMockSession(page, {
      messageTurns: [proposedEditTurnEvents()],
      tauri: {
        handlers: {
          read_workspace_text_file: async (args) => {
            const path = String((args as { path?: string }).path ?? '')
            if (path === 'src/example.ts') return 'old\n'
            return ''
          },
          write_workspace_text_file: async (args) => {
            writes.push(args as { path?: string; content?: string })
          },
        },
      },
    })
    await openChat(page)

    await page.getByTestId('chat-input').fill('Patch src/example.ts')
    await page.getByTestId('chat-send').click()

    await expect(page.getByText('Proposed only')).toBeVisible({ timeout: 15_000 })
    await page.getByRole('button', { name: /src\/example\.ts/ }).click()
    await page.getByTestId('proposed-edit-apply').click()

    await expect.poll(() => writes.length).toBeGreaterThan(0)
    const last = writes[writes.length - 1]
    expect(String(last.path ?? '')).toContain('example.ts')
    expect(String(last.content ?? '')).toContain('new')
    expect(String(last.content ?? '')).not.toContain('old')
  })
})
