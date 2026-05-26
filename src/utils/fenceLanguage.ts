import { css } from '@codemirror/lang-css'
import { go } from '@codemirror/lang-go'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { python } from '@codemirror/lang-python'
import { rust } from '@codemirror/lang-rust'
import { javascript } from '@codemirror/lang-javascript'
import { yaml } from '@codemirror/lang-yaml'
import { StreamLanguage } from '@codemirror/language'
import { shell } from '@codemirror/legacy-modes/mode/shell'
import { toml } from '@codemirror/legacy-modes/mode/toml'
import type { Extension } from '@codemirror/state'

/** Normalize markdown fence info string to a canonical language id. */
export function normalizeFenceLanguage(raw: string): string {
  const t = raw.trim().toLowerCase()
  if (!t) return 'text'
  const base = t.split(/\s+/)[0] ?? t
  const aliases: Record<string, string> = {
    py: 'python',
    python3: 'python',
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    sh: 'shell',
    bash: 'shell',
    zsh: 'shell',
    yml: 'yaml',
    md: 'markdown',
    'c++': 'cpp',
    cc: 'cpp',
    hpp: 'cpp',
  }
  return aliases[base] ?? base
}

/** Human label for fence header chip. */
export function fenceLanguageLabel(language: string): string {
  const id = normalizeFenceLanguage(language)
  const labels: Record<string, string> = {
    text: 'Plain text',
    python: 'Python',
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    rust: 'Rust',
    go: 'Go',
    json: 'JSON',
    yaml: 'YAML',
    markdown: 'Markdown',
    shell: 'Shell',
    css: 'CSS',
    html: 'HTML',
    sql: 'SQL',
    mermaid: 'Mermaid',
    toml: 'TOML',
    cpp: 'C++',
    java: 'Java',
    php: 'PHP',
    xml: 'XML',
    vue: 'Vue',
  }
  return labels[id] ?? id
}

/** CodeMirror extensions for read-only chat fences (built-in langs only). */
export function fenceLanguageExtensions(language: string): Extension[] {
  const id = normalizeFenceLanguage(language)
  switch (id) {
    case 'python':
      return [python()]
    case 'rust':
      return [rust()]
    case 'go':
      return [go()]
    case 'json':
      return [json()]
    case 'markdown':
      return [markdown()]
    case 'yaml':
      return [yaml()]
    case 'toml':
      return [StreamLanguage.define(toml)]
    case 'shell':
      return [StreamLanguage.define(shell)]
    case 'typescript':
      return [javascript({ typescript: true })]
    case 'javascript':
      return [javascript({ typescript: false })]
    case 'css':
    case 'scss':
    case 'less':
      return [css()]
    case 'html':
    case 'htm':
      return [javascript({ jsx: true, typescript: false })]
    default:
      return []
  }
}

export function isMermaidFence(language: string): boolean {
  return normalizeFenceLanguage(language) === 'mermaid'
}
