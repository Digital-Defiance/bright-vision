/** Why Generate / Refine spec controls are disabled (null = ready). */
export function specGenerateBlockedReason(opts: {
  hasTask: boolean
  todosHttpReady: boolean
  isRunning: boolean
  specGenerating?: boolean
  sessionBusy?: boolean
}): string | null {
  if (opts.specGenerating) return 'Spec generation is already running.'
  if (opts.sessionBusy) return 'Wait for the current chat turn to finish, then try again.'
  if (!opts.todosHttpReady) {
    return 'Vision API is not connected — open Terminal, click Start Vision API, then wait for the green status.'
  }
  if (!opts.isRunning) {
    return 'Start a coding session — Terminal tab → green Start button (under Vision API). Generate needs an active session.'
  }
  if (!opts.hasTask) {
    return 'Create a task on the Tasks tab and set it active (or select one on Tasks for Generate spec).'
  }
  return null
}
