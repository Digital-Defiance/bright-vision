/** cecli agent / sub-agent slash commands (merged with core command list). */

export interface SubAgentInfo {
  name: string
  model: string | null
  prompt_preview: string
}

export interface SubAgentListResponse {
  subagents: SubAgentInfo[]
  agent_mode_available: boolean
}

/** Fallback summaries when core has not started or command docstrings are empty. */
export const AGENT_COMMAND_FALLBACKS: { name: string; summary: string }[] = [
  {
    name: '/agent',
    summary: 'Agent mode — autonomous tool loop for a prompt (or switch mode)',
  },
  {
    name: '/invoke-agent',
    summary: 'Run a sub-agent with a prompt (blocking; waits for summary)',
  },
  {
    name: '/spawn-agent',
    summary: 'Spawn a sub-agent session (non-blocking; cecli TUI switches agents)',
  },
  {
    name: '/reap-agent',
    summary: 'Force-destroy the active sub-agent and free resources',
  },
]

/** One-click agent shortcuts above the chat input (full list via `/`). */
export const AGENT_QUICK_COMMANDS = ['/agent', '/invoke-agent', '/spawn-agent', '/reap-agent']

export function mergeAgentCommandFallbacks(
  commands: { name: string; summary: string }[]
): { name: string; summary: string }[] {
  const byName = new Map(commands.map((c) => [c.name.toLowerCase(), c]))
  for (const fb of AGENT_COMMAND_FALLBACKS) {
    const key = fb.name.toLowerCase()
    const existing = byName.get(key)
    if (!existing) {
      byName.set(key, fb)
    } else if (!existing.summary?.trim()) {
      byName.set(key, { ...existing, summary: fb.summary })
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

export function buildInvokeAgentCommand(name: string): string {
  return `/invoke-agent ${name} `
}

export function buildSpawnAgentCommand(name: string): string {
  return `/spawn-agent ${name}`
}
