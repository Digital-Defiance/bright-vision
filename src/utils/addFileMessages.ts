/**
 * User-facing copy when /add or addFiles fails (ignore rules, wrong workspace, etc.).
 * @see docs/ROADMAP.md #32
 */

const LEGACY_GITIGNORE_ADD =
  /can't add\s+(.+?)\s+which is in gitignore\.?/i

/** Shorten long paths for snackbars and alerts. */
export function shortDisplayPath(path: string, maxLen = 48): string {
  const p = path.trim().replace(/\\/g, '/')
  if (p.length <= maxLen) return p
  const base = p.split('/').pop() ?? p
  return `…/${base}`
}

/** Rewrite legacy cecli “in gitignore” tool_error text for the chat timeline. */
export function rewriteAddFileToolMessage(text: string, workspace?: string): string {
  const trimmed = text.trim()
  const legacy = trimmed.match(LEGACY_GITIGNORE_ADD)
  if (!legacy) return text

  const file = shortDisplayPath(legacy[1].trim(), 56)
  const ws = workspace?.trim()
  const wsLine = ws
    ? ` Session project folder: ${shortDisplayPath(ws, 64)}.`
    : ' Check Settings → project folder matches the git root for this file.'

  return (
    `Could not add ${file} to context. The engine treated it as excluded ` +
    `(.gitignore or .cecli.ignore rules for that workspace—not necessarily “gitignored” in Git).` +
    wsLine +
    ' Tracked source under the wrong project path often triggers this.'
  )
}

export function isLegacyGitignoreAddError(text: string): boolean {
  return LEGACY_GITIGNORE_ADD.test(text.trim())
}

/** Snackbar when requested paths are missing from files_in_chat after addFiles. */
export function formatFilesNotAddedSnackbar(missing: string[], workspace?: string): string {
  if (missing.length === 0) return ''
  const listed =
    missing.length <= 3
      ? missing.map((p) => shortDisplayPath(p)).join(', ')
      : `${missing.length} paths (e.g. ${shortDisplayPath(missing[0]!)})`
  const ws = workspace?.trim()
  const wsHint = ws ? ` Workspace: ${shortDisplayPath(ws, 56)}.` : ''
  return (
    `Not in context: ${listed}.${wsHint} ` +
    'See tool messages above—ignore rules, wrong project folder, or path outside the repo.'
  )
}
