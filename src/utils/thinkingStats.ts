import { msPer1kPromptChars } from './thinkingTiming'

export const THINKING_STATS_STORAGE_KEY = 'aider-vision-thinking-stats'

const MAX_RECENT = 50

export interface ThinkingSample {
  at: string
  thoughtMs: number
  promptChars: number
  turnMs: number
}

export interface ModelThinkingAggregate {
  sampleCount: number
  totalThoughtMs: number
  totalPromptChars: number
  recent: ThinkingSample[]
}

export interface ThinkingStatsStore {
  version: 1
  byModel: Record<string, ModelThinkingAggregate>
}

export function emptyThinkingStatsStore(): ThinkingStatsStore {
  return { version: 1, byModel: {} }
}

export function loadThinkingStats(): ThinkingStatsStore {
  try {
    const raw = localStorage.getItem(THINKING_STATS_STORAGE_KEY)
    if (!raw) return emptyThinkingStatsStore()
    const parsed = JSON.parse(raw) as ThinkingStatsStore
    if (parsed?.version !== 1 || typeof parsed.byModel !== 'object') {
      return emptyThinkingStatsStore()
    }
    return parsed
  } catch {
    return emptyThinkingStatsStore()
  }
}

export function saveThinkingStats(store: ThinkingStatsStore): void {
  localStorage.setItem(THINKING_STATS_STORAGE_KEY, JSON.stringify(store))
}

export function recordThinkingSample(
  store: ThinkingStatsStore,
  model: string,
  sample: Omit<ThinkingSample, 'at'>
): ThinkingStatsStore {
  const key = model.trim() || 'unknown'
  const prev = store.byModel[key] ?? {
    sampleCount: 0,
    totalThoughtMs: 0,
    totalPromptChars: 0,
    recent: [],
  }
  const recent = [
    ...prev.recent,
    { ...sample, at: new Date().toISOString() },
  ].slice(-MAX_RECENT)
  const next: ModelThinkingAggregate = {
    sampleCount: prev.sampleCount + 1,
    totalThoughtMs: prev.totalThoughtMs + sample.thoughtMs,
    totalPromptChars: prev.totalPromptChars + sample.promptChars,
    recent,
  }
  return {
    ...store,
    byModel: { ...store.byModel, [key]: next },
  }
}

export interface ModelThinkingSummary {
  model: string
  sampleCount: number
  avgThoughtMs: number
  avgMsPer1kChars: number | null
  avgTurnMs: number
}

export function summarizeModelThinking(
  agg: ModelThinkingAggregate | undefined,
  model: string
): ModelThinkingSummary | null {
  if (!agg || agg.sampleCount === 0) return null
  const avgThoughtMs = agg.totalThoughtMs / agg.sampleCount
  const avgTurnMs =
    agg.recent.reduce((n, s) => n + s.turnMs, 0) / Math.max(1, agg.recent.length)
  const avgMsPer1kChars = msPer1kPromptChars(avgThoughtMs, agg.totalPromptChars / agg.sampleCount)
  return {
    model,
    sampleCount: agg.sampleCount,
    avgThoughtMs,
    avgMsPer1kChars,
    avgTurnMs,
  }
}

export function clearModelThinkingStats(
  store: ThinkingStatsStore,
  model: string
): ThinkingStatsStore {
  const key = model.trim() || 'unknown'
  const { [key]: _, ...rest } = store.byModel
  return { ...store, byModel: rest }
}
