import { Box, Chip, Stack, Typography } from '@mui/material'
import {
  formatGraphTime,
  layoutCommitGraph,
  type CommitGraphNode,
} from '../utils/commitGraph'

interface GitCommitGraphProps {
  nodes: CommitGraphNode[]
  selectedHash: string | null
  onSelect: (hash: string) => void
}

export function GitCommitGraph({ nodes, selectedHash, onSelect }: GitCommitGraphProps) {
  const rows = layoutCommitGraph(nodes)
  if (rows.length === 0) return null

  return (
    <Box
      data-testid="git-commit-graph"
      sx={{
        position: 'relative',
        pl: 1,
        borderLeft: 2,
        borderColor: 'divider',
        ml: 0.5,
      }}
    >
      {rows.map((row, i) => {
        const selected = selectedHash === row.hash
        const isLast = i === rows.length - 1
        return (
          <Stack
            key={row.hash}
            direction="row"
            spacing={1}
            alignItems="flex-start"
            onClick={() => onSelect(row.hash)}
            sx={{
              position: 'relative',
              pl: row.depth * 2,
              py: 0.75,
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: selected ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: 'action.hover' },
              '&::before': isLast
                ? undefined
                : {
                    content: '""',
                    position: 'absolute',
                    left: -1,
                    top: 28,
                    bottom: -4,
                    width: 2,
                    bgcolor: 'divider',
                  },
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: selected ? 'primary.main' : 'grey.600',
                border: 2,
                borderColor: 'background.paper',
                flexShrink: 0,
                mt: 0.6,
                ml: -1.85,
                zIndex: 1,
              }}
            />
            <Stack spacing={0.25} sx={{ minWidth: 0, flexGrow: 1 }}>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', color: 'primary.light' }}
                >
                  {row.short_hash}
                </Typography>
                {row.is_merge && (
                  <Chip label="merge" size="small" variant="outlined" sx={{ height: 18 }} />
                )}
                <Typography variant="caption" color="text.secondary">
                  {formatGraphTime(row.timestamp)}
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                {row.subject}
              </Typography>
            </Stack>
          </Stack>
        )
      })}
    </Box>
  )
}
