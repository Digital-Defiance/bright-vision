import { describe, expect, it } from 'vitest'
import { layoutCommitGraph, type CommitGraphNode } from './commitGraph'

describe('layoutCommitGraph', () => {
  it('returns empty for no nodes', () => {
    expect(layoutCommitGraph([])).toEqual([])
  })

  it('marks merge commits with depth 1', () => {
    const nodes: CommitGraphNode[] = [
      {
        hash: 'c2',
        short_hash: 'c2',
        subject: 'merge',
        timestamp: 2,
        parents: ['c1', 'b1'],
        is_merge: true,
      },
      {
        hash: 'c1',
        short_hash: 'c1',
        subject: 'main',
        timestamp: 1,
        parents: [],
        is_merge: false,
      },
    ]
    const rows = layoutCommitGraph(nodes)
    expect(rows[0].depth).toBe(1)
    expect(rows[1].depth).toBe(0)
  })
})
