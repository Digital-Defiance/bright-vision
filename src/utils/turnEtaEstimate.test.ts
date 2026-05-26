import { describe, expect, it } from 'vitest'
import { emptyThinkingStatsStore, recordTurnTiming } from './thinkingStats'
import { estimateTurnEta } from './turnEtaEstimate'

describe('estimateTurnEta', () => {
  it('returns none without history', () => {
    const eta = estimateTurnEta({
      model: 'ollama_chat/llama3',
      promptChars: 100,
      elapsedMs: 5000,
      statsStore: emptyThinkingStatsStore(),
    })
    expect(eta.confidence).toBe('none')
    expect(eta.shortLabel).toBeNull()
  })

  it('estimates remaining from median history', () => {
    let store = emptyThinkingStatsStore()
    for (let i = 0; i < 5; i++) {
      store = recordTurnTiming(store, 'm1', {
        responseMs: 60_000,
        thinkMs: 10_000,
        promptChars: 200,
        tokensReceived: 400,
        tokensSent: 1000,
      })
    }
    const eta = estimateTurnEta({
      model: 'm1',
      promptChars: 200,
      elapsedMs: 20_000,
      statsStore: store,
    })
    expect(eta.confidence).toBe('medium')
    expect(eta.remainingMs).toBeGreaterThan(30_000)
    expect(eta.shortLabel).toMatch(/left/)
  })
})
