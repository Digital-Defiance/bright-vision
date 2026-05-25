import { describe, expect, it } from 'vitest'
import { splitAssistantSections } from './chatStream'

describe('splitAssistantSections', () => {
  it('returns body when no markers', () => {
    expect(splitAssistantSections('hello')).toEqual([{ kind: 'body', content: 'hello' }])
  })

  it('splits thinking and answer markers', () => {
    const text = '► **THINKING**\nplan\n► **ANSWER**\nresult'
    const sections = splitAssistantSections(text)
    expect(sections.map((s) => s.kind)).toEqual(['thinking', 'answer'])
    expect(sections[0].content).toContain('plan')
    expect(sections[1].content).toContain('result')
  })

  it('includes reasoning section', () => {
    const text = '► **REASONING**\nwhy\n► **ANSWER**\nok'
    const sections = splitAssistantSections(text)
    expect(sections.some((s) => s.kind === 'reasoning')).toBe(true)
    expect(sections.some((s) => s.kind === 'answer')).toBe(true)
  })
})
