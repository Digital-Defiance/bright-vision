import { describe, expect, it } from 'vitest'
import {
  buildEmptyLlmRetryMessage,
  formatEmptyLlmWarning,
  isEmptyLlmWarning,
  rewriteEmptyLlmWarningIfNeeded,
} from './emptyLlmResponse'

describe('emptyLlmResponse', () => {
  it('detects legacy cecli warning', () => {
    expect(isEmptyLlmWarning('Empty response received from LLM. Check your provider account?')).toBe(
      true
    )
    expect(isEmptyLlmWarning('Network error')).toBe(false)
  })

  it('rewrites for local vs cloud', () => {
    const legacy = 'Empty response received from LLM. Check your provider account?'
    expect(rewriteEmptyLlmWarningIfNeeded(legacy, true)).toContain('Ollama')
    expect(rewriteEmptyLlmWarningIfNeeded(legacy, true)).not.toContain('account')
    expect(rewriteEmptyLlmWarningIfNeeded(legacy, false)).toContain('API keys')
  })

  it('builds exact and nudge retries', () => {
    expect(buildEmptyLlmRetryMessage('proceed', 'exact')).toBe('proceed')
    expect(buildEmptyLlmRetryMessage('hello', 'nudge')).toContain('hello')
    expect(buildEmptyLlmRetryMessage('hello', 'nudge')).toContain('empty')
  })

  it('formatEmptyLlmWarning is stable', () => {
    expect(formatEmptyLlmWarning(true)).toMatch(/local model/i)
  })
})
