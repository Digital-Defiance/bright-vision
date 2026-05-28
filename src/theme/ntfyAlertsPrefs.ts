import { NTFY_ALERTS_STORAGE_KEY } from '../storageKeys'
import { DISPLAY_VISION } from '../brand'

export { NTFY_ALERTS_STORAGE_KEY }

export const DEFAULT_NTFY_SERVER = 'https://ntfy.sh'

export interface NtfyAlertsPrefs {
  enabled: boolean
  /** e.g. https://ntfy.sh or self-hosted base URL (no trailing slash). */
  serverBase: string
  /** Secret topic — treat like a password. */
  topic: string
  /** Only notify when turn duration is at least this many seconds (0 = any turn). */
  minDurationSec: number
  /** When false, skip notify while the BrightVision window is visible. */
  notifyWhenBackgroundOnly: boolean
}

export const DEFAULT_NTFY_ALERTS_PREFS: NtfyAlertsPrefs = {
  enabled: false,
  serverBase: DEFAULT_NTFY_SERVER,
  topic: '',
  minDurationSec: 60,
  notifyWhenBackgroundOnly: true,
}

export function generateNtfyTopic(): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().replace(/-/g, '')
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`
  return `bv_${id}`
}

export function ensureNtfyTopic(topic: string | undefined): string {
  const t = topic?.trim()
  return t ? t : generateNtfyTopic()
}

export function ntfySubscribeUrl(prefs: Pick<NtfyAlertsPrefs, 'serverBase' | 'topic'>): string {
  const base = (prefs.serverBase.trim() || DEFAULT_NTFY_SERVER).replace(/\/+$/, '')
  return `${base}/${encodeURIComponent(prefs.topic.trim())}`
}

export function ntfyAppSubscribeUrl(prefs: Pick<NtfyAlertsPrefs, 'serverBase' | 'topic'>): string {
  const serverBase = (prefs.serverBase.trim() || DEFAULT_NTFY_SERVER).replace(/\/+$/, '')
  const host = serverBase.replace(/^https?:\/\//, '')
  const topic = encodeURIComponent(prefs.topic.trim())
  const params = new URLSearchParams({ display: DISPLAY_VISION })
  if (serverBase.startsWith('http://')) {
    params.set('secure', 'false')
  }
  return `ntfy://${host}/${topic}?${params.toString()}`
}

export function loadNtfyAlertsPrefs(): NtfyAlertsPrefs {
  try {
    const raw = localStorage.getItem(NTFY_ALERTS_STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_NTFY_ALERTS_PREFS, topic: generateNtfyTopic() }
    }
    const parsed = JSON.parse(raw) as Partial<NtfyAlertsPrefs>
    return {
      ...DEFAULT_NTFY_ALERTS_PREFS,
      ...parsed,
      topic: ensureNtfyTopic(parsed.topic),
      minDurationSec: Math.max(0, parsed.minDurationSec ?? DEFAULT_NTFY_ALERTS_PREFS.minDurationSec),
      serverBase: (parsed.serverBase?.trim() || DEFAULT_NTFY_SERVER).replace(/\/+$/, ''),
    }
  } catch {
    return { ...DEFAULT_NTFY_ALERTS_PREFS, topic: generateNtfyTopic() }
  }
}

export function saveNtfyAlertsPrefs(prefs: NtfyAlertsPrefs): void {
  localStorage.setItem(NTFY_ALERTS_STORAGE_KEY, JSON.stringify(prefs))
}

export function formatTurnCompleteNtfyBody(opts: {
  durationMs: number
  queuedRemaining: number
  editedCount: number
}): string {
  const mins = Math.floor(opts.durationMs / 60_000)
  const secs = Math.round((opts.durationMs % 60_000) / 1000)
  const dur = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  let line = `Turn finished in ${dur}.`
  if (opts.queuedRemaining > 0) {
    line += ` ${opts.queuedRemaining} message${opts.queuedRemaining === 1 ? '' : 's'} still queued.`
  } else {
    line += ' Ready in BrightVision.'
  }
  if (opts.editedCount > 0) {
    line += ` ${opts.editedCount} file${opts.editedCount === 1 ? '' : 's'} edited.`
  }
  return line
}

export function shouldSendNtfyTurnAlert(
  prefs: NtfyAlertsPrefs,
  opts: { durationMs: number; documentVisible: boolean }
): boolean {
  if (!prefs.enabled || !prefs.topic.trim()) return false
  if (opts.durationMs < prefs.minDurationSec * 1000) return false
  if (prefs.notifyWhenBackgroundOnly && opts.documentVisible) return false
  return true
}

export function ntfyPushTitle(): string {
  return DISPLAY_VISION
}

export function ntfyPriorityForDuration(durationMs: number): 'default' | 'high' {
  return durationMs >= 10 * 60_000 ? 'high' : 'default'
}
