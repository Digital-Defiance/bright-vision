import { describe, expect, it } from 'vitest'
import { describeGitChange } from './gitStatus'

describe('describeGitChange', () => {
  it('labels untracked', () => {
    expect(describeGitChange('?', '?')).toBe('untracked')
  })

  it('labels staged and worktree', () => {
    expect(describeGitChange('M', ' ')).toBe('staged M')
    expect(describeGitChange(' ', 'M')).toBe('wt M')
  })
})
