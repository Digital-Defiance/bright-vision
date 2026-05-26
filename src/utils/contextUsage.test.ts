import { describe, expect, it } from 'vitest'
import {
  charsToEstimatedTokens,
  formatSessionContextChip,
  formatTokenCount,
  parseTokenUsageReport,
} from './contextUsage'

describe('contextUsage', () => {
  it('parses token usage with k suffix', () => {
    const r = parseTokenUsageReport('Tokens: 1.2k sent, 450 received')
    expect(r?.tokensSent).toBe(1200)
    expect(r?.tokensReceived).toBe(450)
  })

  it('parses cecli ↑↓ usage report', () => {
    const r = parseTokenUsageReport('1.2k ↑ 450 ↓')
    expect(r?.tokensSent).toBe(1200)
    expect(r?.tokensReceived).toBe(450)
  })

  it('parses cecli usage with cache segments and trailing cost', () => {
    const r = parseTokenUsageReport(
      '1.2k/500 ↑ 450 ↓ $0.00 • 2.1k ↑↓ $0.00\nLLM elapsed time: 12.34 seconds'
    )
    expect(r?.tokensSent).toBe(1200)
    expect(r?.tokensReceived).toBe(450)
  })

  it('parses legacy Tokens line inside multiline tool_output', () => {
    const r = parseTokenUsageReport(
      '[BrightVision Core] Tokens: 120 sent, 45 received\nEdited: src/App.tsx'
    )
    expect(r?.tokensSent).toBe(120)
    expect(r?.tokensReceived).toBe(45)
  })

  it('formats session chip', () => {
    expect(
      formatSessionContextChip(3, {
        lastReport: { tokensSent: 18000, tokensReceived: 900, raw: '' },
        estimatedFromAdds: 0,
      })
    ).toBe('3 files · 18.0k sent')
  })

  it('estimates tokens from chars', () => {
    expect(charsToEstimatedTokens(4000)).toBe(1000)
    expect(formatTokenCount(1000)).toBe('1.0k')
  })
})
