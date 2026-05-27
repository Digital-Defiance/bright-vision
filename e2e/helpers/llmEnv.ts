import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const E2E_DIR = path.dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = path.resolve(E2E_DIR, '../..')

/** Minimal git repo — same idea as `tests/core/test_hello_llm.py` (GitTemporaryDirectory). */
export const LLM_E2E_WORKSPACE = path.join(REPO_ROOT, 'e2e/fixtures/hello-workspace')

const CORE_API_URL = 'http://127.0.0.1:8741'
const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434'

export function isLlmE2eEnabled(): boolean {
  return process.env.E2E_LLM === '1'
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}
  const out: Record<string, string> = {}
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

function loadLocalLlmEnv(): Record<string, string> {
  const paths = [
    path.join(REPO_ROOT, 'local-llm.env'),
    path.join(REPO_ROOT, 'local-llm', 'local-llm.env'),
    path.join(process.env.HOME ?? '', 'local-llm', 'local-llm.env'),
    path.join(process.env.HOME ?? '', '.config', 'local-llm', 'env'),
  ]
  let merged: Record<string, string> = {}
  for (const p of paths) {
    merged = { ...merged, ...parseEnvFile(p) }
  }
  return merged
}

export function resolveOllamaHost(): string {
  const fromEnv =
    process.env.E2E_OLLAMA_HOST?.trim() ||
    process.env.OLLAMA_HOST?.trim() ||
    loadLocalLlmEnv().OLLAMA_HOST?.trim()
  return fromEnv || DEFAULT_OLLAMA_HOST
}

/** Ollama tag without the `ollama_chat/` prefix. */
export function resolveOllamaTag(): string {
  const explicit = process.env.E2E_OLLAMA_MODEL?.trim()
  if (explicit) {
    if (explicit.startsWith('ollama_chat/')) return explicit.slice('ollama_chat/'.length)
    if (explicit.startsWith('ollama/')) return explicit.slice('ollama/'.length)
    return explicit
  }
  const fromFile =
    loadLocalLlmEnv().DATA_MODEL?.trim() ||
    loadLocalLlmEnv().LLM_MODEL?.trim() ||
    loadLocalLlmEnv().CHAT_MODEL?.trim()
  if (fromFile) {
    if (fromFile.startsWith('ollama_chat/')) return fromFile.slice('ollama_chat/'.length)
    if (fromFile.startsWith('ollama/')) return fromFile.slice('ollama/'.length)
    return fromFile
  }
  return ''
}

export async function resolveOllamaTagWithFallback(): Promise<string> {
  const configured = resolveOllamaTag()
  if (configured) return configured
  const host = resolveOllamaHost()
  const res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(10_000) })
  if (!res.ok) throw new Error(`Ollama /api/tags: HTTP ${res.status}`)
  const body = (await res.json()) as { models?: { name?: string; model?: string }[] }
  const first = body.models?.[0]
  const tag = first?.name ?? first?.model
  if (!tag) {
    throw new Error('No models in Ollama — run: ollama pull <model>')
  }
  return tag
}

export function visionModelFromTag(tag: string): string {
  if (tag.startsWith('ollama_chat/') || tag.startsWith('ollama/')) return tag
  return `ollama_chat/${tag}`
}

export function resolveVisionModel(): string {
  const explicit = process.env.E2E_OLLAMA_MODEL?.trim()
  if (explicit) return visionModelFromTag(explicit)
  const tag = resolveOllamaTag()
  if (tag) return visionModelFromTag(tag)
  return ''
}

/** Create/init minimal workspace (committed README; `.git` created on first LLM e2e run). */
export function ensureLlmE2eWorkspace(): string {
  fs.mkdirSync(LLM_E2E_WORKSPACE, { recursive: true })
  const readme = path.join(LLM_E2E_WORKSPACE, 'README.md')
  if (!fs.existsSync(readme)) {
    fs.writeFileSync(readme, '# E2E hello workspace\n', 'utf8')
  }
  if (!fs.existsSync(path.join(LLM_E2E_WORKSPACE, '.git'))) {
    execSync(
      'git init -b main && git add README.md && git -c user.email=e2e@test -c user.name=e2e commit -m "e2e init"',
      { cwd: LLM_E2E_WORKSPACE, stdio: 'pipe' }
    )
  }
  return LLM_E2E_WORKSPACE
}

/** Env vars the headless core needs for LiteLLM → Ollama (UI config does not reach the server process). */
export function ollamaEnvForCore(): Record<string, string> {
  const out: Record<string, string> = {}
  const host = resolveOllamaHost()
  if (host) out.OLLAMA_API_BASE = host
  const file = loadLocalLlmEnv()
  if (file.OLLAMA_API_KEY?.trim()) out.OLLAMA_API_KEY = file.OLLAMA_API_KEY.trim()
  if (file.OLLAMA_HOST?.trim() && !out.OLLAMA_API_BASE) {
    out.OLLAMA_API_BASE = file.OLLAMA_HOST.trim()
  }
  return out
}

export function buildLlmE2eConfig() {
  const host = resolveOllamaHost()
  return {
    model: resolveVisionModel(),
    ollamaApiBase: host,
    localLlmRoot: '',
    manageLocalLlm: false,
    extraParams: '{}',
    workingDir: ensureLlmE2eWorkspace(),
    autoApproveLimit: 0,
    promptBeforeCommit: true,
    autoStageOnDone: false,
    coreEnginePath: '.',
    pythonPath: '',
    coreApiUrl: '/api/core',
    coreApiToken: '',
    contextFiles: [] as string[],
  }
}

export async function assertOllamaForLlmE2e(): Promise<void> {
  const host = resolveOllamaHost()
  const tag = await resolveOllamaTagWithFallback()
  let res: Response
  try {
    res = await fetch(`${host}/api/tags`, { signal: AbortSignal.timeout(10_000) })
  } catch (err) {
    throw new Error(
      `Ollama not reachable at ${host} (${err}). Install Ollama and run: ollama serve`
    )
  }
  if (!res.ok) {
    throw new Error(`Ollama /api/tags failed: HTTP ${res.status}`)
  }
  const body = (await res.json()) as { models?: { name?: string; model?: string }[] }
  const names = (body.models ?? []).flatMap((m) =>
    [m.name, m.model].filter((n): n is string => Boolean(n))
  )
  const pulled = names.some((n) => n === tag || n.startsWith(`${tag}:`))
  if (!pulled) {
    throw new Error(
      `Model "${tag}" is not pulled. Run: ollama pull ${tag}\n` +
        `Or set E2E_OLLAMA_MODEL to a tag from: ollama list`
    )
  }
}

export function coreHealthUrl(): string {
  return `${CORE_API_URL}/health`
}

/** Env for spawning Vision core — must not put repo root on PYTHONPATH (shadows `cecli`). */
export function buildVisionCoreEnv(
  extra: Record<string, string> = {}
): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra }
  env.PYTHONSAFEPATH = '1'
  env.BRIGHT_VISION_HEADLESS = '1'
  env.AIDER_VISION_HEADLESS = '1'
  delete env.PYTHONPATH
  return env
}
