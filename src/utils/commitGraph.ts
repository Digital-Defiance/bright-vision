export interface CommitGraphNode {
  hash: string
  short_hash: string
  subject: string
  timestamp: number
  parents: string[]
  is_merge: boolean
}

export interface CommitGraphRow extends CommitGraphNode {
  /** Visual indent for merge / branch lines (0 = main line). */
  depth: number
}

/** Lay out newest-first git log nodes for a simple vertical graph. */
export function layoutCommitGraph(nodes: CommitGraphNode[]): CommitGraphRow[] {
  if (nodes.length === 0) return []

  const byHash = new Map(nodes.map((n) => [n.hash, n]))
  const rows: CommitGraphRow[] = []
  const indexOnMain = new Set<string>()

  for (const node of nodes) {
    let depth = 0
    if (node.is_merge) {
      depth = 1
    } else if (node.parents.length === 1) {
      const parent = node.parents[0]
      if (parent && !indexOnMain.has(parent) && byHash.has(parent)) {
        depth = 1
      }
    }
    rows.push({ ...node, depth })
    indexOnMain.add(node.hash)
  }

  return rows
}

export function formatGraphTime(ts: number): string {
  if (!ts) return ''
  try {
    return new Date(ts * 1000).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return ''
  }
}
