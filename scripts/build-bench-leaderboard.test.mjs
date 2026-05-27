import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildLeaderboard,
  validateSubmission,
  submissionFromIssueFields,
} from './build-bench-leaderboard.mjs'
import { parseIssueFormBody } from './bench-from-issue.mjs'

describe('bench leaderboard', () => {
  it('validates and builds public entries', () => {
    const sub = validateSubmission(
      {
        schemaVersion: 1,
        displayName: 'nova',
        hideGitHubOnWall: false,
        submittedBy: 'octocat',
        submittedAt: '2026-05-26T12:00:00.000Z',
        hardware: 'apple-silicon',
        model: 'qwen2.5:7b',
        stats: { turnCount: 10, medianTps: 31.25 },
      },
      'test.json'
    )
    const board = buildLeaderboard([{ id: 'a', data: sub }])
    assert.equal(board.entryCount, 1)
    assert.equal(board.entries[0].github, 'octocat')
    assert.equal(board.entries[0].stats.medianTps, 31.3)
  })

  it('hides github when requested', () => {
    const sub = validateSubmission(
      {
        schemaVersion: 1,
        displayName: 'ghost',
        hideGitHubOnWall: true,
        submittedBy: 'octocat',
        submittedAt: '2026-05-26T12:00:00.000Z',
        hardware: 'cpu-only',
        model: 'llama3.2',
        stats: { turnCount: 5, medianTps: 12 },
      },
      'x.json'
    )
    const board = buildLeaderboard([{ id: 'b', data: sub }])
    assert.equal(board.entries[0].github, undefined)
  })

  it('parses issue form body', () => {
    const body = `### Display name
metal-box

### Privacy
- [x] Hide my GitHub login on the public leaderboard

### Hardware
nvidia-desktop

### Model
qwen2.5:7b

### Turn count
42

### Median output TPS
28.5
`
    const fields = parseIssueFormBody(body)
    assert.equal(fields.display_name, 'metal-box')
    assert.equal(fields.hide_github, true)
    const sub = submissionFromIssueFields(fields, 'testuser')
    assert.equal(sub.submittedBy, 'testuser')
    assert.equal(sub.hideGitHubOnWall, true)
  })
})
