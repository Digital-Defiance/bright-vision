import { expect, type Page } from '@playwright/test'
import { coreHealthUrl, resolveVisionModel } from './llmEnv'

const CORE_BASE = 'http://127.0.0.1:8741'

export async function createCoreSession(workspace: string, model?: string): Promise<string> {
  const res = await fetch(`${CORE_BASE}/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workspace,
      model: model || resolveVisionModel(),
      auto_yes: true,
    }),
  })
  const text = await res.text()
  expect(res.ok, text).toBeTruthy()
  const body = JSON.parse(text) as { session_id?: string }
  expect(body.session_id).toBeTruthy()
  return body.session_id as string
}

export type TranscriptRow = { role: string; content: string }

export async function fetchSessionTranscript(sessionId: string): Promise<TranscriptRow[]> {
  const res = await fetch(`${CORE_BASE}/sessions/${sessionId}/transcript`)
  const text = await res.text()
  expect(res.ok, text).toBeTruthy()
  const body = JSON.parse(text) as { messages?: TranscriptRow[] }
  return body.messages ?? []
}

export async function assertCoreHealthOk() {
  const res = await fetch(coreHealthUrl())
  expect(res.ok).toBeTruthy()
  const body = (await res.json()) as { status?: string }
  expect(body.status).toBe('ok')
}

/** Capture session_id from POST /sessions when the UI starts a session. */
export async function captureSessionIdOnUiStart(page: Page, start: () => Promise<void>): Promise<string> {
  const responseP = page.waitForResponse(
    (r) =>
      r.url().includes('/sessions') &&
      r.request().method() === 'POST' &&
      r.status() === 200,
    { timeout: 120_000 }
  )
  await start()
  const response = await responseP
  const body = (await response.json()) as { session_id?: string }
  expect(body.session_id).toBeTruthy()
  return body.session_id as string
}
