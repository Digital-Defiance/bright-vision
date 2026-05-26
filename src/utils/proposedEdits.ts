/**
 * Split assistant markdown into prose vs fenced blocks that look like
 * aider SEARCH/REPLACE proposals (often shown but not yet applied).
 */

export type ProposedEditKind = 'search_replace' | 'fenced_file' | 'code'

export type AssistantContentSegment =
  | { type: 'prose'; content: string }
  | {
      type: 'display_fence'
      language: string
      body: string
      /** False while the closing fence is still streaming. */
      complete: boolean
    }
  | {
      type: 'proposed_edit'
      title: string
      language: string
      body: string
      kind: ProposedEditKind
    }

const SEARCH_MARK = '<<<<<<< SEARCH'
const REPLACE_MARK = '>>>>>>> REPLACE'

export function isSearchReplaceBlock(body: string): boolean {
  return body.includes(SEARCH_MARK) || body.includes(REPLACE_MARK)
}

/** Likely a repo-relative file path on its own line (aider editblock convention). */
export function looksLikeFilePath(line: string): boolean {
  const t = line.trim()
  if (!t || /\s/.test(t)) return false
  if (/^https?:\/\//i.test(t)) return false
  if (t.startsWith('►') || t.startsWith('#')) return false
  return (
    (t.includes('/') || t.startsWith('.')) &&
    /\.[a-zA-Z0-9]{1,12}$/.test(t.split('/').pop() ?? '')
  )
}

function classifyEdit(body: string, pathHint: string | undefined): ProposedEditKind {
  if (isSearchReplaceBlock(body)) return 'search_replace'
  if (pathHint) return 'fenced_file'
  return 'code'
}

function editTitle(pathHint: string | undefined, language: string, body: string): string {
  if (pathHint) return pathHint
  if (language && looksLikeFilePath(language)) return language
  const first = body.split('\n').find((l) => looksLikeFilePath(l))?.trim()
  if (first) return first
  return language ? `Edit (${language})` : 'Proposed edit'
}

/**
 * Parse assistant text into prose and collapsible proposed-edit fences.
 * Incomplete trailing fences (still streaming) are surfaced as proposed edits when plausible.
 */
export function parseAssistantContent(content: string): AssistantContentSegment[] {
  const segments: AssistantContentSegment[] = []
  let i = 0

  while (i < content.length) {
    const fence = content.indexOf('```', i)
    if (fence === -1) {
      const tail = content.slice(i)
      if (tail.trim()) segments.push({ type: 'prose', content: tail })
      break
    }

    let prose = content.slice(i, fence)
    let pathHint: string | undefined
    const proseLines = prose.split('\n')
    const lastLine = proseLines[proseLines.length - 1] ?? ''
    if (looksLikeFilePath(lastLine)) {
      pathHint = lastLine.trim()
      prose = proseLines.slice(0, -1).join('\n')
    }
    if (prose.trim()) {
      segments.push({ type: 'prose', content: prose })
    }

    const open = content.slice(fence).match(/^```([^\n]*)\n/)
    if (!open) {
      segments.push({ type: 'prose', content: content.slice(fence, fence + 3) })
      i = fence + 3
      continue
    }

    const language = open[1].trim()
    const bodyStart = fence + open[0].length
    let close = content.indexOf('\n```', bodyStart)
    let body: string
    let consumed: number
    if (close === -1) {
      body = content.slice(bodyStart)
      consumed = content.length - fence
    } else {
      body = content.slice(bodyStart, close)
      consumed = close + 4 - fence
    }

    const kind = classifyEdit(body, pathHint)
    const isProposed = kind === 'search_replace' || kind === 'fenced_file'

    if (isProposed) {
      segments.push({
        type: 'proposed_edit',
        title: editTitle(pathHint, language, body),
        language,
        body,
        kind,
      })
    } else {
      segments.push({
        type: 'display_fence',
        language,
        body,
        complete: close !== -1,
      })
    }

    i = fence + consumed
    if (close === -1) break
  }

  return segments
}

export function normalizeRepoPath(p: string): string {
  return p.replace(/\\/g, '/').replace(/^\.\//, '')
}

/** Whether a proposed block likely matches a path from `done.edited_files`. */
export function isProposedEditApplied(title: string, appliedFiles: string[]): boolean {
  if (!appliedFiles.length) return false
  const norm = normalizeRepoPath(title)
  const bases = new Set(appliedFiles.map(normalizeRepoPath))
  if (bases.has(norm)) return true
  for (const f of bases) {
    if (f.endsWith('/' + norm) || norm.endsWith('/' + f) || f.endsWith(norm) || norm.endsWith(f)) {
      return true
    }
  }
  return false
}
