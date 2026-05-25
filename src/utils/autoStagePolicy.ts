/** Whether to auto-stage edited files after a turn (pure policy; no I/O). */
export function shouldAutoStage(opts: {
  enabled: boolean
  engineCommitted: boolean
  isTauri: boolean
  workingDir: string
  editedFiles: string[]
}): boolean {
  return (
    opts.enabled &&
    !opts.engineCommitted &&
    opts.isTauri &&
    opts.workingDir.trim().length > 0 &&
    normalizeStagePaths(opts.editedFiles).length > 0
  )
}

export function normalizeStagePaths(files: string[]): string[] {
  return [...new Set(files.map((p) => p.trim()).filter(Boolean))]
}
