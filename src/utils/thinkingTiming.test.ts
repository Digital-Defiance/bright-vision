import { describe, expect, it } from 'vitest'
import {
  createTurnTimingTracker,
  finalizeTurnTiming,
  formatDurationMs,
  sectionDurationByIndex,
  sumThoughtMs,
  syncTurnTimingFromContent,
} from './thinkingTiming'
import { splitAssistantSections } from './chatStream'
import { recordThinkingSample, summarizeModelThinking } from './thinkingStats'

describe('thinkingTiming', () => {
  it('formats durations', () => {
    expect(formatDurationMs(450)).toBe('450ms')
    expect(formatDurationMs(2500)).toBe('2.5s')
  })

  it('tracks section transitions', () => {
    let t = createTurnTimingTracker(120, 0)
    t = syncTurnTimingFromContent(t, '► **THINKING**\nplan\n', 1000)
    t = syncTurnTimingFromContent(t, '► **THINKING**\nplan\n► **ANSWER**\nok\n', 5000)
    const result = finalizeTurnTiming(t, '► **THINKING**\nplan\n► **ANSWER**\nok\n', 8000)
    expect(result.userPromptChars).toBe(120)
    expect(result.sections.map((s) => s.kind)).toEqual(['thinking', 'answer'])
    expect(result.sections[0].durationMs).toBe(4000)
    expect(result.sections[1].durationMs).toBe(3000)
    expect(result.thoughtMs).toBe(4000)
    expect(result.turnDurationMs).toBe(8000)
  })

  it('zips section durations onto split sections', () => {
    const content = '► **THINKING**\na\n► **ANSWER**\nb'
    const sections = splitAssistantSections(content)
    const durations = [
      { kind: 'thinking' as const, durationMs: 1000 },
      { kind: 'answer' as const, durationMs: 500 },
    ]
    const map = sectionDurationByIndex(sections, durations)
    expect(map.get(0)).toBe(1000)
    expect(map.get(1)).toBe(500)
  })
})

describe('thinkingStats', () => {
  it('accumulates per model', () => {
    let store = recordThinkingSample(
      { version: 1, byModel: {} },
      'test/model',
      { thoughtMs: 2000, promptChars: 1000, turnMs: 3000 }
    )
    store = recordThinkingSample(store, 'test/model', {
      thoughtMs: 4000,
      promptChars: 2000,
      turnMs: 5000,
    })
    const summary = summarizeModelThinking(store.byModel['test/model'], 'test/model')
    expect(summary?.sampleCount).toBe(2)
    expect(summary?.avgThoughtMs).toBe(3000)
    expect(sumThoughtMs([])).toBe(0)
  })
})
