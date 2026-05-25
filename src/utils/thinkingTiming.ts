import type { AssistantSection, AssistantSectionKind } from './chatStream'
import { getActiveAssistantSection } from './chatStream'

export interface SectionDuration {
  kind: AssistantSectionKind
  durationMs: number
}

export interface TurnThinkingTiming {
  turnDurationMs: number
  sections: SectionDuration[]
  userPromptChars: number
  /** Sum of thinking + reasoning section durations. */
  thoughtMs: number
}

export function formatDurationMs(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  if (ms < 1000) return `${Math.round(ms)}ms`
  const s = ms / 1000
  if (s < 60) return `${s.toFixed(1)}s`
  const m = Math.floor(s / 60)
  const rem = s % 60
  return `${m}m ${rem.toFixed(0)}s`
}

export function isThoughtSection(kind: AssistantSectionKind): boolean {
  return kind === 'thinking' || kind === 'reasoning'
}

export function sumThoughtMs(sections: SectionDuration[]): number {
  return sections.filter((s) => isThoughtSection(s.kind)).reduce((n, s) => n + s.durationMs, 0)
}

/** Map section index in `splitAssistantSections` output → duration ms (when kinds align in order). */
export function sectionDurationByIndex(
  contentSections: AssistantSection[],
  durations: SectionDuration[]
): Map<number, number> {
  const map = new Map<number, number>()
  let di = 0
  for (let si = 0; si < contentSections.length; si++) {
    const sec = contentSections[si]
    if (sec.kind === 'body') continue
    while (di < durations.length && durations[di].kind !== sec.kind) di++
    if (di < durations.length && durations[di].kind === sec.kind) {
      map.set(si, durations[di].durationMs)
      di++
    }
  }
  return map
}

export interface TurnTimingTracker {
  turnStartMs: number
  userPromptChars: number
  sections: SectionDuration[]
  activeKind: AssistantSectionKind | null
  activeStartMs: number
}

export function createTurnTimingTracker(promptChars: number, now = Date.now()): TurnTimingTracker {
  return {
    turnStartMs: now,
    userPromptChars: promptChars,
    sections: [],
    activeKind: null,
    activeStartMs: now,
  }
}

export function syncTurnTimingFromContent(
  tracker: TurnTimingTracker,
  content: string,
  now = Date.now()
): TurnTimingTracker {
  const kind = getActiveAssistantSection(content)
  if (tracker.activeKind === null) {
    return { ...tracker, activeKind: kind, activeStartMs: now }
  }
  if (kind === tracker.activeKind) return tracker
  const closed: SectionDuration = {
    kind: tracker.activeKind,
    durationMs: Math.max(0, now - tracker.activeStartMs),
  }
  return {
    ...tracker,
    sections: [...tracker.sections, closed],
    activeKind: kind,
    activeStartMs: now,
  }
}

export function finalizeTurnTiming(
  tracker: TurnTimingTracker,
  content: string,
  now = Date.now()
): TurnThinkingTiming {
  let t = syncTurnTimingFromContent(tracker, content, now)
  const sections = [...t.sections]
  if (t.activeKind !== null) {
    sections.push({
      kind: t.activeKind,
      durationMs: Math.max(0, now - t.activeStartMs),
    })
  }
  const turnDurationMs = Math.max(0, now - t.turnStartMs)
  return {
    turnDurationMs,
    sections,
    userPromptChars: t.userPromptChars,
    thoughtMs: sumThoughtMs(sections),
  }
}

export function msPer1kPromptChars(thoughtMs: number, promptChars: number): number | null {
  if (promptChars <= 0 || thoughtMs <= 0) return null
  return (thoughtMs / promptChars) * 1000
}
