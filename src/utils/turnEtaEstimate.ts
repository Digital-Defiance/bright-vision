import {
  buildTimingStatsView,
  computeRunningAvgOutputTps,
  type ThinkingStatsStore,
} from './thinkingStats'
import { formatDurationMs } from './thinkingTiming'

export type TurnEtaConfidence = 'none' | 'low' | 'medium' | 'high'

export interface TurnEtaEstimate {
  /** Milliseconds until estimated turn end; null if unknown. */
  remainingMs: number | null
  /** Estimated total turn duration from Send. */
  totalMs: number | null
  /** Short label for the activity bar, e.g. `~2m left*`. */
  shortLabel: string | null
  tooltip: string
  confidence: TurnEtaConfidence
}

export interface TurnEtaInput {
  model: string
  promptChars: number
  elapsedMs: number
  statsStore: ThinkingStatsStore
  /** Core progress fraction 0–1 when determinate (repo scan, etc.). */
  progressFraction?: number | null
  /** Live output TPS from current turn usage line when available. */
  liveOutputTps?: number | null
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

function promptScale(promptChars: number, baselineChars: number): number {
  if (baselineChars <= 0) return 1
  return clamp(promptChars / baselineChars, 0.5, 2)
}

/**
 * Estimate remaining turn time from per-model timing history (median + p90),
 * optional progress fraction, and historical output TPS when logged.
 */
export function estimateTurnEta(input: TurnEtaInput): TurnEtaEstimate {
  const model = input.model.trim() || 'unknown'
  const view = buildTimingStatsView(input.statsStore, model)
  const n = view.response.count

  if (n === 0) {
    return {
      remainingMs: null,
      totalMs: null,
      shortLabel: null,
      tooltip:
        'No timing history for this model yet. Complete a few turns to enable ETA estimates.',
      confidence: 'none',
    }
  }

  const median = view.response.median
  const p90 = view.response.p90
  const avgPrompt =
    view.history.reduce((sum, r) => sum + r.promptChars, 0) /
    Math.max(1, view.history.length)
  const scale = promptScale(input.promptChars, avgPrompt)
  let estimatedTotal = median * scale

  const histTps = computeRunningAvgOutputTps(
    input.statsStore.history.filter((r) => r.model === model)
  )
  const tps = input.liveOutputTps ?? histTps

  const progress = input.progressFraction
  if (progress != null && progress > 0.05 && progress < 0.98) {
    const fromProgress = input.elapsedMs / progress
    estimatedTotal = Math.max(estimatedTotal, fromProgress)
  }

  let remaining = Math.max(0, Math.round(estimatedTotal - input.elapsedMs))
  const p90Remaining = Math.max(0, Math.round(p90 * scale - input.elapsedMs))

  let confidence: TurnEtaConfidence = n >= 8 ? 'high' : n >= 3 ? 'medium' : 'low'
  if (progress != null && progress > 0.1) confidence = confidence === 'low' ? 'medium' : confidence

  const lines: string[] = [
    `Model: ${model}`,
    `History: ${n} turn${n === 1 ? '' : 's'} (median ${formatDurationMs(median)}, p90 ${formatDurationMs(p90)})`,
    `Prompt scale: ×${scale.toFixed(2)} (${input.promptChars.toLocaleString()} chars vs ~${Math.round(avgPrompt).toLocaleString()} avg)`,
    `Estimated total: ~${formatDurationMs(Math.round(estimatedTotal))}`,
  ]

  if (tps != null && tps > 0) {
    lines.push(`Output rate: ~${tps.toFixed(1)} tok/s (history or current turn usage)`)
  } else {
    lines.push(
      'Output tok/s not in history yet — ETA uses response time only. Usage lines like `1.2k ↑ 450 ↓` improve estimates.'
    )
  }

  if (progress != null && progress > 0) {
    lines.push(`Progress: ${Math.round(progress * 100)}% (blended into estimate)`)
  }

  lines.push(`Typical range: ${formatDurationMs(remaining)} – ${formatDurationMs(p90Remaining)} remaining`)
  lines.push(
    'GPU % (when logged) is not used for this estimate — correlation with time-left needs dogfood data (#34).'
  )

  if (remaining <= 0 && input.elapsedMs > estimatedTotal * 1.2) {
    remaining = Math.max(0, p90Remaining)
    lines.push('Running longer than median — using p90 for remaining time.')
  }

  const shortLabel =
    remaining > 0 ? `~${formatDurationMs(remaining)} left*` : null

  return {
    remainingMs: remaining > 0 ? remaining : null,
    totalMs: Math.round(estimatedTotal),
    shortLabel,
    tooltip: lines.join('\n'),
    confidence,
  }
}
