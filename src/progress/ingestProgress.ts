import type { CoreProgressEvent } from '../ipc/events'
import { PHASE_LABELS, type ProcessPhase, type ProcessUpdate } from './types'

export function progressFraction(ev: CoreProgressEvent): number | null {
  if (typeof ev.fraction === 'number' && Number.isFinite(ev.fraction)) {
    return Math.min(1, Math.max(0, ev.fraction))
  }
  if (
    typeof ev.current === 'number' &&
    typeof ev.total === 'number' &&
    ev.total > 0
  ) {
    return Math.min(1, Math.max(0, ev.current / ev.total))
  }
  return null
}

export function phaseForProgressLabel(label: string, message: string): ProcessPhase {
  const hay = `${label} ${message}`.toLowerCase()
  if (/waiting for/.test(hay)) return 'reasoning'
  if (/scanning repo|updating repo map|repo map/.test(hay)) return 'scan'
  return 'scan'
}

/** Map core ``progress`` SSE to activity-bar state (determinate when current/total present). */
export function progressEventToUpdate(ev: CoreProgressEvent): ProcessUpdate {
  const label = String(ev.label ?? '').trim()
  const message = String(ev.message ?? '').trim()
  const fraction = progressFraction(ev)
  const phase = phaseForProgressLabel(label, message)

  return {
    phase,
    label: label || PHASE_LABELS[phase],
    detail: (message || label).slice(0, 120) || undefined,
    progress: fraction,
    current: typeof ev.current === 'number' ? ev.current : undefined,
    total: typeof ev.total === 'number' ? ev.total : undefined,
  }
}
