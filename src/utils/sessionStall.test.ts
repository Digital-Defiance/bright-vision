import { describe, expect, it } from 'vitest'
import { buildTurnActivity, isLikelyStalled, turnActivityHint } from './sessionStall'

describe('sessionStall', () => {
  it('detects streaming when tokens are recent', () => {
    const now = 100_000
    const a = buildTurnActivity(true, now - 1000, now - 500, 'Waiting for ollama', now)
    expect(a.kind).toBe('streaming')
    expect(isLikelyStalled(a)).toBe(false)
  })

  it('detects post-answer wait when tokens stopped but progress still waiting', () => {
    const now = 100_000
    const a = buildTurnActivity(true, now - 20_000, now - 15_000, 'Waiting for ollama', now)
    expect(a.kind).toBe('post_answer_wait')
    expect(turnActivityHint(a, 9)).toContain('Answer is visible')
  })

  it('flags stall when no events for a long time', () => {
    const now = 100_000
    const a = buildTurnActivity(true, now - 60_000, now - 55_000, 'Scanning repo map', now)
    expect(isLikelyStalled(a)).toBe(true)
    expect(turnActivityHint(a, 9)).toContain('Clear the queue')
    expect(turnActivityHint(a, 9)).toContain('stuck')
  })
})
