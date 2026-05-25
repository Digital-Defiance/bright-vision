import { useCallback, useEffect, useRef, useState } from 'react'
import {
  loadThinkingStats,
  recordThinkingSample,
  saveThinkingStats,
  summarizeModelThinking,
  type ModelThinkingSummary,
  type ThinkingStatsStore,
} from '../utils/thinkingStats'
import type { ThinkingTimingPrefs } from '../theme/thinkingTimingPrefs'
import {
  createTurnTimingTracker,
  finalizeTurnTiming,
  formatDurationMs,
  syncTurnTimingFromContent,
  type TurnThinkingTiming,
  type TurnTimingTracker,
} from '../utils/thinkingTiming'
import { getActiveAssistantSection, type AssistantSectionKind } from '../utils/chatStream'

export interface LiveThinkingState {
  activeKind: AssistantSectionKind | null
  activeElapsedMs: number
  turnElapsedMs: number
  activeLabel: string
}

function liveLabel(kind: AssistantSectionKind | null): string {
  if (kind === 'thinking') return 'Thinking'
  if (kind === 'reasoning') return 'Reasoning'
  if (kind === 'answer') return 'Answer'
  if (kind === 'body') return 'Working'
  return ''
}

export function useThinkingTiming(model: string, prefs: ThinkingTimingPrefs, isBusy: boolean) {
  const trackerRef = useRef<TurnTimingTracker | null>(null)
  const [live, setLive] = useState<LiveThinkingState | null>(null)
  const [statsStore, setStatsStore] = useState<ThinkingStatsStore>(() => loadThinkingStats())

  const modelSummary: ModelThinkingSummary | null = prefs.showStatsInSettings
    ? summarizeModelThinking(statsStore.byModel[model.trim() || 'unknown'], model)
    : null

  const beginTurn = useCallback((promptChars: number) => {
    trackerRef.current = createTurnTimingTracker(promptChars)
    setLive({
      activeKind: null,
      activeElapsedMs: 0,
      turnElapsedMs: 0,
      activeLabel: 'Working',
    })
  }, [])

  const syncContent = useCallback((content: string) => {
    const t = trackerRef.current
    if (!t) return
    trackerRef.current = syncTurnTimingFromContent(t, content)
  }, [])

  const finalizeTurn = useCallback((content: string): TurnThinkingTiming | null => {
    const t = trackerRef.current
    if (!t) return null
    const result = finalizeTurnTiming(t, content)
    trackerRef.current = null
    setLive(null)
    return result
  }, [])

  const reset = useCallback(() => {
    trackerRef.current = null
    setLive(null)
  }, [])

  const recordCompletedTurn = useCallback(
    (timing: TurnThinkingTiming) => {
      if (timing.thoughtMs <= 0 && timing.turnDurationMs <= 0) return
      setStatsStore((prev) => {
        const next = recordThinkingSample(prev, model, {
          thoughtMs: timing.thoughtMs,
          promptChars: timing.userPromptChars,
          turnMs: timing.turnDurationMs,
        })
        saveThinkingStats(next)
        return next
      })
    },
    [model]
  )

  const refreshStats = useCallback(() => {
    setStatsStore(loadThinkingStats())
  }, [])

  useEffect(() => {
    if (!isBusy || !prefs.showLiveTimer) {
      if (!isBusy) setLive(null)
      return
    }
    const tick = () => {
      const t = trackerRef.current
      if (!t) return
      const now = Date.now()
      const kind = t.activeKind
      setLive({
        activeKind: kind,
        activeElapsedMs: kind !== null ? now - t.activeStartMs : 0,
        turnElapsedMs: now - t.turnStartMs,
        activeLabel: liveLabel(kind),
      })
    }
    tick()
    const id = window.setInterval(tick, 200)
    return () => window.clearInterval(id)
  }, [isBusy, prefs.showLiveTimer])

  return {
    live: prefs.showLiveTimer && isBusy ? live : null,
    beginTurn,
    syncContent,
    finalizeTurn,
    reset,
    recordCompletedTurn,
    modelSummary,
    refreshStats,
    statsStore,
    formatDuration: formatDurationMs,
    peekActiveKind: (content: string) => getActiveAssistantSection(content),
  }
}
