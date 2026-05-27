import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined'
import SaveIcon from '@mui/icons-material/Save'
import {
  Box,
  Button,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useState } from 'react'
import { isTauriRuntime } from '../../ipc/isTauri'
import { useEditorSession } from '../../hooks/useEditorSession'
import {
  EXPLORER_WIDTH_PX,
  loadEditorPrefs,
  saveEditorPrefs,
  type EditorPrefs,
} from '../../theme/editorPrefs'
import { CodeEditor } from './CodeEditor'
import { EditorFileTabs } from './EditorFileTabs'
import { FileExplorer } from './FileExplorer'
import type { EditorGitBadge } from '../../utils/editorGitStatus'
import type { EditorLanguagePrefs } from '../../theme/editorLanguagePrefs'

interface EditorPanelProps {
  workingDir: string
  isRunning: boolean
  editorLanguagePrefs: EditorLanguagePrefs
  pendingOpenPath?: string | null
  onPendingOpenConsumed?: () => void
  gitStatusByPath?: Map<string, EditorGitBadge>
  onAddToContext?: (paths: string[]) => void
  onNotify?: (message: string, severity: 'info' | 'warning' | 'error') => void
}

export function EditorPanel({
  workingDir,
  isRunning,
  editorLanguagePrefs,
  pendingOpenPath,
  onPendingOpenConsumed,
  gitStatusByPath,
  onAddToContext,
  onNotify,
}: EditorPanelProps) {
  const [prefs, setPrefs] = useState<EditorPrefs>(() => loadEditorPrefs())
  const editor = useEditorSession(workingDir)

  useEffect(() => {
    saveEditorPrefs(prefs)
  }, [prefs])

  const desktop = isTauriRuntime()

  useEffect(() => {
    if (!pendingOpenPath || !desktop) return
    void editor.openFile(pendingOpenPath)
    onPendingOpenConsumed?.()
    // Open once per pending path from App (avoid re-run when tab state updates).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenPath, desktop])

  const toggleExplorer = useCallback(() => {
    setPrefs((p) => ({ ...p, explorerOpen: !p.explorerOpen }))
  }, [])

  const handleCloseTab = useCallback(
    (path: string) => {
      editor.closeTab(path)
    },
    [editor.closeTab]
  )

  const handleSave = useCallback(async () => {
    const ok = await editor.saveActive()
    if (ok) onNotify?.('Saved', 'info')
    else if (editor.activeTab?.error) onNotify?.(editor.activeTab.error, 'error')
  }, [editor, onNotify])

  const handleAddToContext = useCallback(() => {
    if (!editor.activePath || !onAddToContext) return
    if (!isRunning) {
      onNotify?.('Start the session from Terminal before adding files to context', 'warning')
      return
    }
    onAddToContext([editor.activePath])
  }, [editor.activePath, isRunning, onAddToContext, onNotify])

  const emptyEditor = (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 1,
        p: 3,
        minHeight: 0,
      }}
    >
      <FolderOpenOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
      <Typography variant="body2" color="text.secondary" align="center" maxWidth={360}>
        Pick a file in the explorer on the right, or hide the explorer with the toolbar button.
      </Typography>
    </Box>
  )

  const editorMain = (
    <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {editor.activeTab?.loading ? (
        <Typography sx={{ p: 2 }} color="text.secondary">
          Loading…
        </Typography>
      ) : editor.activeTab?.error ? (
        <Typography sx={{ p: 2 }} color="error.main">
          {editor.activeTab.error}
        </Typography>
      ) : editor.activeTab ? (
        <CodeEditor
          path={editor.activeTab.path}
          value={editor.activeTab.content}
          onChange={(v) => editor.setTabContent(editor.activeTab!.path, v)}
          onSave={() => void handleSave()}
          enabledOptionalPluginIds={editorLanguagePrefs.enabledOptionalPluginIds}
        />
      ) : (
        emptyEditor
      )}
    </Box>
  )

  return (
    <Box
      className="vision-editor"
      sx={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}
      data-testid="editor-panel"
    >
      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          px: 1.5,
          py: 0.75,
          borderBottom: 1,
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
          Editor
        </Typography>
        <Tooltip title={prefs.explorerOpen ? 'Hide explorer' : 'Show explorer'}>
          <Button
            size="small"
            variant={prefs.explorerOpen ? 'contained' : 'outlined'}
            onClick={toggleExplorer}
            data-testid="editor-toggle-explorer"
            startIcon={prefs.explorerOpen ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          >
            Explorer
          </Button>
        </Tooltip>
        <Button
          size="small"
          variant="contained"
          disabled={!editor.activeTab || editor.activeTab.loading || !desktop}
          startIcon={<SaveIcon />}
          onClick={() => void handleSave()}
          data-testid="editor-save"
        >
          Save
        </Button>
        {onAddToContext && (
          <Button
            size="small"
            variant="outlined"
            disabled={!editor.activePath || !isRunning}
            onClick={handleAddToContext}
            data-testid="editor-add-to-context"
          >
            Add to context
          </Button>
        )}
      </Stack>

      <EditorFileTabs
        tabs={editor.tabs}
        activePath={editor.activePath}
        onSelect={editor.setActivePath}
        onClose={handleCloseTab}
      />

      <Box sx={{ flex: 1, minHeight: 0, display: 'flex', minWidth: 0 }}>
        {!desktop ? (
          <Paper variant="outlined" sx={{ m: 2, p: 2, flex: 1 }}>
            <Typography variant="body2" color="text.secondary">
              The editor reads and writes files through the desktop app. Use{' '}
              <strong>yarn tauri dev</strong> to browse, open, and save project files here.
            </Typography>
          </Paper>
        ) : (
          <>
            {editorMain}
            {prefs.explorerOpen ? (
              <Box
                sx={{
                  width: EXPLORER_WIDTH_PX,
                  maxWidth: '38vw',
                  flexShrink: 0,
                  minHeight: 0,
                  display: 'flex',
                  borderLeft: 1,
                  borderColor: 'divider',
                }}
                data-testid="editor-explorer-pane"
              >
                <FileExplorer
                  workingDir={workingDir}
                  activePath={editor.activePath}
                  onOpenFile={(path) => void editor.openFile(path)}
                  gitStatusByPath={gitStatusByPath}
                />
              </Box>
            ) : null}
          </>
        )}
      </Box>
    </Box>
  )
}
