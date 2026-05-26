/**
 * Empty LLM body (no tokens / no tool calls) — common on Ollama timeout, unload, or context pressure.
 * @see docs/ROADMAP.md (chat UX)
 */

const EMPTY_LLM_PATTERN = /empty response received from llm/i

export function isEmptyLlmWarning(text: string): boolean {
  return EMPTY_LLM_PATTERN.test(text.trim())
}

/** User-facing copy; never mention cloud “provider account” for local models. */
export function formatEmptyLlmWarning(isLocalLlm: boolean): string {
  if (isLocalLlm) {
    return (
      'The local model returned an empty reply (no text or tool calls). ' +
      'Ollama may have timed out, unloaded the model, or hit context limits. ' +
      'Try Local LLM → Ping LLM, reduce context files, then Retry.'
    )
  }
  return (
    'The model returned an empty reply (no text or tool calls). ' +
    'Check API keys, quota, and provider status, then Retry.'
  )
}

/** Rewrite legacy cecli warning text for the chat UI. */
export function rewriteEmptyLlmWarningIfNeeded(text: string, isLocalLlm: boolean): string {
  if (!isEmptyLlmWarning(text)) return text
  return formatEmptyLlmWarning(isLocalLlm)
}

/**
 * Retry strategy:
 * - **Exact** — resend the same user message (best for transient Ollama/network flake).
 * - **Nudge** — same intent plus an explicit “don’t reply empty” instruction (second attempt).
 */
export function buildEmptyLlmRetryMessage(
  userMessage: string,
  mode: 'exact' | 'nudge'
): string {
  const base = userMessage.trim()
  if (!base) return ''
  if (mode === 'exact') return base
  return `${base}\n\n(Your previous reply was empty. Continue the same task and respond with a complete answer—not an empty message.)`
}
