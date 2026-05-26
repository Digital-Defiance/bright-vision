import { describe, expect, it } from 'vitest'
import { isSearchReplaceBlock, parseAssistantContent } from './proposedEdits'

describe('parseAssistantContent', () => {
  it('renders plain code fences as display_fence', () => {
    const content = 'Here is an example:\n```python\nprint("hi")\n```\nDone.'
    const segs = parseAssistantContent(content)
    expect(segs.some((s) => s.type === 'display_fence' && s.language === 'python')).toBe(true)
    expect(segs.some((s) => s.type === 'proposed_edit')).toBe(false)
  })

  it('keeps SEARCH/REPLACE as proposed_edit', () => {
    const content = '```\n<<<<<<< SEARCH\nold\n=======\nnew\n>>>>>>> REPLACE\n```'
    const segs = parseAssistantContent(content)
    expect(segs.some((s) => s.type === 'proposed_edit')).toBe(true)
  })

  it('detects search replace in body', () => {
    expect(isSearchReplaceBlock('<<<<<<< SEARCH\nx')).toBe(true)
  })
})
