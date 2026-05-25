/** Parse `/add` or `/drop` with optional partial path for filesystem completion. */

export interface FileCommandParse {
  command: '/add' | '/drop'
  pathPrefix: string
}

export function parseFileCommandInput(input: string): FileCommandParse | null {
  const trimmed = input.trimStart()
  const m = trimmed.match(/^\/(add|drop)\s+(.*)$/i)
  if (!m) return null
  const cmd = m[1].toLowerCase()
  if (cmd !== 'add' && cmd !== 'drop') return null
  return { command: `/${cmd}` as '/add' | '/drop', pathPrefix: m[2] ?? '' }
}

export function replaceFileCommandPath(input: string, path: string): string {
  const parsed = parseFileCommandInput(input)
  if (!parsed) return input
  const lead = input.match(/^\s*/)?.[0] ?? ''
  return `${lead}${parsed.command} ${path} `
}
