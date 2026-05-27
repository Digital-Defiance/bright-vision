import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import {
  Box,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { listWorkspaceFiles } from '../../ipc/workspaceEditor'
import { isTauriRuntime } from '../../ipc/isTauri'
import { buildFileTree, filterFileTree, type FileTreeNode } from '../../utils/fileTree'
import {
  gitBadgeColor,
  type EditorGitBadge,
} from '../../utils/editorGitStatus'

interface FileExplorerProps {
  workingDir: string
  activePath: string | null
  onOpenFile: (path: string) => void
  gitStatusByPath?: Map<string, EditorGitBadge>
}

const labelSx = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontSize: '0.875rem',
  lineHeight: 1.45,
  color: 'text.primary',
} as const

function TreeLabel({ text, title }: { text: string; title?: string }) {
  return (
    <Box component="span" title={title ?? text} sx={labelSx} data-testid="explorer-node-label">
      {text}
    </Box>
  )
}

function TreeRows({
  nodes,
  depth,
  expanded,
  onToggle,
  activePath,
  onOpenFile,
  gitStatusByPath,
}: {
  nodes: FileTreeNode[]
  depth: number
  expanded: Set<string>
  onToggle: (dirPath: string) => void
  activePath: string | null
  onOpenFile: (path: string) => void
  gitStatusByPath?: Map<string, EditorGitBadge>
}) {
  return (
    <>
      {nodes.map((node) => {
        const padLeft = 8 + depth * 12
        if (node.isDir) {
          const open = expanded.has(node.path)
          return (
            <Box key={`dir-${node.path}`}>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => onToggle(node.path)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onToggle(node.path)
                  }
                }}
                data-testid={`explorer-dir-${node.path}`}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  py: 0.45,
                  pr: 1,
                  pl: `${padLeft}px`,
                  width: '100%',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                  borderRadius: 1,
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    color: 'text.secondary',
                  }}
                >
                  {open ? (
                    <ExpandMoreIcon sx={{ fontSize: 18 }} aria-hidden />
                  ) : (
                    <ChevronRightIcon sx={{ fontSize: 18 }} aria-hidden />
                  )}
                  <FolderOutlinedIcon sx={{ fontSize: 17, ml: 0.25 }} aria-hidden />
                </Box>
                <TreeLabel text={node.name} />
              </Box>
              {open && node.children?.length ? (
                <TreeRows
                  nodes={node.children}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  activePath={activePath}
                  onOpenFile={onOpenFile}
                  gitStatusByPath={gitStatusByPath}
                />
              ) : null}
            </Box>
          )
        }
        const badge = gitStatusByPath?.get(node.path)
        const selected = activePath === node.path
        return (
          <Box
            key={node.path}
            role="button"
            tabIndex={0}
            onClick={() => onOpenFile(node.path)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onOpenFile(node.path)
              }
            }}
            data-testid={`explorer-file-${node.path}`}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              py: 0.45,
              pr: 1,
              pl: `${padLeft + 16}px`,
              width: '100%',
              boxSizing: 'border-box',
              cursor: 'pointer',
              borderRadius: 1,
              bgcolor: selected ? 'action.selected' : 'transparent',
              '&:hover': { bgcolor: selected ? 'action.selected' : 'action.hover' },
            }}
          >
            <InsertDriveFileOutlinedIcon
              sx={{ fontSize: 18, flexShrink: 0, color: 'text.secondary' }}
              aria-hidden
            />
            <TreeLabel text={node.name} title={node.path} />
            {badge ? (
              <Typography
                component="span"
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  color: gitBadgeColor(badge),
                  flexShrink: 0,
                }}
                title={`Git: ${badge}`}
                data-testid={`explorer-git-${node.path}`}
              >
                {badge}
              </Typography>
            ) : null}
          </Box>
        )
      })}
    </>
  )
}

export function FileExplorer({
  workingDir,
  activePath,
  onOpenFile,
  gitStatusByPath,
}: FileExplorerProps) {
  const [paths, setPaths] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set())

  const refresh = useCallback(async () => {
    if (!isTauriRuntime()) {
      setError('File explorer requires the desktop app')
      setPaths([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const files = await listWorkspaceFiles(workingDir)
      setPaths(files)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setPaths([])
    } finally {
      setLoading(false)
    }
  }, [workingDir])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const tree = useMemo(() => filterFileTree(buildFileTree(paths), filter), [paths, filter])

  useEffect(() => {
    if (!tree.length) return
    setExpanded((prev) => {
      const next = new Set(prev)
      for (const node of tree) {
        if (node.isDir) next.add(node.path)
      }
      return next
    })
  }, [paths])

  const onToggle = useCallback((dirPath: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(dirPath)) next.delete(dirPath)
      else next.add(dirPath)
      return next
    })
  }, [])

  const fileCount = paths.length

  return (
    <Box
      className="vision-editor-explorer"
      sx={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
      data-testid="editor-file-explorer"
    >
      <Box
        sx={{
          px: 1,
          py: 0.75,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="caption" fontWeight={600} sx={{ flex: 1 }} noWrap>
          Files{fileCount > 0 ? ` (${fileCount})` : ''}
        </Typography>
        <Tooltip title="Refresh">
          <span>
            <IconButton size="small" onClick={() => void refresh()} disabled={loading}>
              <RefreshIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
      <Box sx={{ px: 1, py: 0.75, flexShrink: 0 }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter files…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          inputProps={{ 'data-testid': 'editor-explorer-filter' }}
        />
      </Box>
      <Box sx={{ flex: 1, overflow: 'auto', minHeight: 0, width: '100%' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={22} />
          </Box>
        )}
        {error && (
          <Typography variant="body2" color="warning.main" sx={{ px: 1.5, py: 1 }}>
            {error}
          </Typography>
        )}
        {!loading && !error && tree.length === 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ px: 1.5, py: 1 }}>
            {filter.trim() ? 'No matches.' : 'No files listed.'}
          </Typography>
        )}
        <Box component="nav" aria-label="Workspace files" sx={{ width: '100%', py: 0.5 }}>
          <TreeRows
            nodes={tree}
            depth={0}
            expanded={expanded}
            onToggle={onToggle}
            activePath={activePath}
            onOpenFile={onOpenFile}
            gitStatusByPath={gitStatusByPath}
          />
        </Box>
      </Box>
    </Box>
  )
}
