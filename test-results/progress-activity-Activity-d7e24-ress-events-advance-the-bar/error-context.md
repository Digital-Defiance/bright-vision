# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: progress-activity.spec.ts >> Activity bar progress (core progress SSE) >> staggered progress events advance the bar
- Location: e2e/progress-activity.spec.ts:34:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('vision-activity').getByText('20%')
Expected: visible
Timeout: 6000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 6000ms
  - waiting for getByTestId('vision-activity').getByText('20%')

```

```yaml
- img "Aider Vision":
  - img: av
- button "Chat":
  - button
  - text: Chat
- button "Tasks":
  - button
  - text: Tasks
- button "Terminal":
  - button
  - text: Terminal
- button "Git":
  - button
  - text: Git
- button "Settings":
  - button
  - text: Settings
- img "Aider Vision":
  - img: vision aider
- text: Session active — (repo map) 0 files
- status:
  - progressbar
  - text: Sending
- text: Agent is working — use Stop to cancel the current turn.
- button "Dismiss message"
- paragraph: stagger scan
- text: Commands
- button "/help"
- button "/add"
- button "/drop"
- button "/diff"
- button "/commit"
- button "/undo"
- button "/ls"
- text: type
- code: /
- text: for all ·
- code: /add path
- text: Tab completes paths (desktop)
- button "Attach images"
- button "Attach last terminal output to message"
- button "Add folder to context"
- textbox "Queue a follow-up for Aider Vision Core..."
- button "Queue" [disabled]
- button "Stop"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { scanProgressTurnEvents } from './helpers/fixtures'
  3  | import { openChat, startMockSession } from './helpers/session'
  4  | 
  5  | test.describe('Activity bar progress (core progress SSE)', () => {
  6  |   test('shows determinate percent from progress events', async ({ page }) => {
  7  |     await startMockSession(page, {
  8  |       messageTurns: [
  9  |         [
  10 |           {
  11 |             type: 'progress',
  12 |             label: 'Scanning repo',
  13 |             current: 40,
  14 |             total: 100,
  15 |             message: '40/100',
  16 |           },
  17 |         ],
  18 |       ],
  19 |       messageDelayMs: 400,
  20 |     })
  21 |     await openChat(page)
  22 | 
  23 |     await page.getByTestId('chat-input').fill('scan the repo')
  24 |     await page.getByTestId('chat-send').click()
  25 | 
  26 |     const activity = page.getByTestId('vision-activity')
  27 |     await expect(activity).toBeVisible({ timeout: 10_000 })
  28 |     await expect(activity.getByText('40%')).toBeVisible({ timeout: 8_000 })
  29 |     await expect(activity).toHaveAttribute('data-indeterminate', 'false')
  30 |     await expect(activity.getByText('Scanning repo')).toBeVisible()
  31 |     await expect(activity.getByText('40/100')).toBeVisible()
  32 |   })
  33 | 
  34 |   test('staggered progress events advance the bar', async ({ page }) => {
  35 |     await startMockSession(page, {
  36 |       messageTurns: [
  37 |         [
  38 |           {
  39 |             type: 'progress',
  40 |             label: 'Scanning repo',
  41 |             current: 20,
  42 |             total: 100,
  43 |           },
  44 |           {
  45 |             type: 'progress',
  46 |             label: 'Scanning repo',
  47 |             current: 60,
  48 |             total: 100,
  49 |           },
  50 |         ],
  51 |       ],
  52 |       messageEventDelayMs: 200,
  53 |       messageDelayMs: 200,
  54 |     })
  55 |     await openChat(page)
  56 | 
  57 |     await page.getByTestId('chat-input').fill('stagger scan')
  58 |     await page.getByTestId('chat-send').click()
  59 | 
  60 |     const activity = page.getByTestId('vision-activity')
> 61 |     await expect(activity.getByText('20%')).toBeVisible({ timeout: 6_000 })
     |                                             ^ Error: expect(locator).toBeVisible() failed
  62 |     await expect(activity.getByText('60%')).toBeVisible({ timeout: 6_000 })
  63 |   })
  64 | })
  65 | 
```