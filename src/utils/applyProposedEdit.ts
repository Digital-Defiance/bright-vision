import {
  isSearchReplaceBlock,
  looksLikeFilePath,
  normalizeRepoPath,
  type AssistantContentSegment,
} from './proposedEdits'
import { readWorkspaceTextFile, writeWorkspaceTextFile } from '../ipc/workspaceEditor'

export interface ApplyEditResult {
  ok: boolean
  path?: string
  message: string
}

export interface SearchReplacePair {
  search: string
  replace: string
}

const SEARCH_REPLACE_RE =
  /<<<<<<< SEARCH\s*\n([\s\S]*?)\n=======\s*\n([\s\S]*?)\n>>>>>>> REPLACE/g

/** Split one or more SEARCH/REPLACE blocks from assistant or fence body. */
export function parseSearchReplacePairs(body: string): SearchReplacePair[] {
  if (!isSearchReplaceBlock(body)) return []
  const pairs: SearchReplacePair[] = []
  const re = new RegExp(SEARCH_REPLACE_RE.source, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(body)) !== null) {
    pairs.push({ search: m[1], replace: m[2] })
  }
  return pairs
}

export function resolveProposedEditPath(
  title: string,
  body: string,
  language: string
): string | null {
  const t = title.trim()
  if (t && looksLikeFilePath(t)) return normalizeRepoPath(t)
  if (language.trim() && looksLikeFilePath(language.trim())) {
    return normalizeRepoPath(language.trim())
  }
  const first = body.split('\n').find((l) => looksLikeFilePath(l.trim()))?.trim()
  if (first) return normalizeRepoPath(first)
  return null
}

function searchReplaceCandidates(search: string): string[] {
  const normalized = search.replace(/\r\n/g, '\n')
  const variants = [
    search,
    normalized,
    search.trimEnd(),
    normalized.trimEnd(),
    search.endsWith('\n') ? search.slice(0, -1) : `${search}\n`,
    normalized.endsWith('\n') ? normalized.slice(0, -1) : `${normalized}\n`,
  ]
  return [...new Set(variants.filter((s) => s.length > 0 || !search.trim()))]
}

/** Line-trimmed consecutive match when exact SEARCH fails (common with trailing spaces). */
function applyLineTrimmedBlockReplace(
  content: string,
  search: string,
  replace: string
): string | null {
  const searchLines = search.replace(/\r\n/g, '\n').split('\n')
  if (searchLines.length < 2) {
    return null
  }
  const fileLines = content.replace(/\r\n/g, '\n').split('\n')
  const n = searchLines.length
  for (let i = 0; i <= fileLines.length - n; i++) {
    let ok = true
    for (let j = 0; j < n; j++) {
      if (fileLines[i + j].trimEnd() !== searchLines[j].trimEnd()) {
        ok = false
        break
      }
    }
    if (!ok) continue
    const replaceLines = replace.replace(/\r\n/g, '\n').split('\n')
    const next = [
      ...fileLines.slice(0, i),
      ...replaceLines,
      ...fileLines.slice(i + n),
    ]
    return next.join('\n')
  }
  return null
}

/** First exact occurrence replace; fuzzy fallbacks for newline / trailing-space drift. */
export function applySearchReplaceToContent(
  content: string,
  search: string,
  replace: string
): string | null {
  if (!search.trim()) {
    return content + replace
  }
  for (const candidate of searchReplaceCandidates(search)) {
    const idx = content.indexOf(candidate)
    if (idx !== -1) {
      return content.slice(0, idx) + replace + content.slice(idx + candidate.length)
    }
  }
  if (search.includes('\n')) {
    return applyLineTrimmedBlockReplace(content, search, replace)
  }
  return null
}

export async function applyProposedEditSegment(
  workingDir: string,
  segment: Extract<AssistantContentSegment, { type: 'proposed_edit' }>
): Promise<ApplyEditResult> {
  const path = resolveProposedEditPath(segment.title, segment.body, segment.language)
  if (!path) {
    return { ok: false, message: 'Could not determine file path for this edit.' }
  }

  try {
    let content = ''
    try {
      content = await readWorkspaceTextFile(workingDir, path)
    } catch {
      content = ''
    }

    if (segment.kind === 'fenced_file') {
      await writeWorkspaceTextFile(workingDir, path, segment.body)
      return { ok: true, path, message: `Wrote ${path}` }
    }

    if (!isSearchReplaceBlock(segment.body)) {
      return {
        ok: false,
        message: 'Only SEARCH/REPLACE or full-file proposals can be applied from chat.',
      }
    }

    const pairs = parseSearchReplacePairs(segment.body)
    if (!pairs.length) {
      return { ok: false, message: 'No SEARCH/REPLACE blocks found in this proposal.' }
    }

    let next = content
    for (const { search, replace } of pairs) {
      const patched = applySearchReplaceToContent(next, search, replace)
      if (patched === null) {
        return {
          ok: false,
          message: `SEARCH block did not match ${path} — file unchanged. Try /add ${path} and ask the model to retry.`,
        }
      }
      next = patched
    }

    await writeWorkspaceTextFile(workingDir, path, next)
    return { ok: true, path, message: `Applied ${pairs.length} edit(s) to ${path}` }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { ok: false, message: msg }
  }
}
