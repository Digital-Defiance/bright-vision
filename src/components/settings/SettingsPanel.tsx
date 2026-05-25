import RestartAltIcon from '@mui/icons-material/RestartAlt'
import SaveIcon from '@mui/icons-material/Save'
import { useEffect, useState } from 'react'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { invoke } from '@tauri-apps/api/core'
import {
  CORE_ENGINE_DIR,
  formatContextFilesInput,
  parseContextFilesInput,
  type AiderConfig,
} from '../../ipc/config'
import { isTauriRuntime } from '../../ipc/isTauri'
import { WorkspaceBar } from '../WorkspaceBar'
import type { AppearanceConfig } from '../../theme/appearance'
import { AppearanceSection } from './AppearanceSection'

interface SettingsPanelProps {
  config: AiderConfig
  appearance: AppearanceConfig
  apiPreview: string
  sessionFiles?: string[]
  onChange: (config: AiderConfig) => void
  onAppearanceChange: (appearance: AppearanceConfig) => void
  onSave: () => void
  onReset: () => void
}

export function SettingsPanel({
  config,
  appearance,
  apiPreview,
  sessionFiles,
  onChange,
  onAppearanceChange,
  onSave,
  onReset,
}: SettingsPanelProps) {
  const [bundledEnginePath, setBundledEnginePath] = useState<string>('')

  useEffect(() => {
    if (!isTauriRuntime()) return
    invoke<string>('engine_install_path', { coreEnginePath: config.coreEnginePath })
      .then(setBundledEnginePath)
      .catch(() => setBundledEnginePath(''))
  }, [config.coreEnginePath])

  return (
    <Stack spacing={3}>
      <Typography variant="h5" fontWeight={600}>
        Model & system
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Choose a <strong>project</strong> for git edits. The {CORE_ENGINE_DIR} engine is bundled with
        the app — you only set the project path, not a copy of core per repo.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="LLM model"
            fullWidth
            size="small"
            value={config.model}
            onChange={(e) => onChange({ ...config, model: e.target.value })}
          />
          <TextField
            label="LiteLLM extra params (JSON)"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={config.extraParams}
            onChange={(e) => onChange({ ...config, extraParams: e.target.value })}
            slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.85rem' } } }}
            helperText="Passed as LITELLM_EXTRA_PARAMS when spawning the API on desktop."
          />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Project (git repository)
            </Typography>
            <WorkspaceBar
              workingDir={config.workingDir}
              onChange={(workingDir) => onChange({ ...config, workingDir })}
            />
          </Box>
          <TextField
            label="Context files (one per line, relative to workspace)"
            fullWidth
            size="small"
            multiline
            rows={4}
            value={formatContextFilesInput(config.contextFiles)}
            onChange={(e) =>
              onChange({ ...config, contextFiles: parseContextFilesInput(e.target.value) })
            }
            helperText="Sent as files[] when creating a session."
          />
          {sessionFiles && sessionFiles.length > 0 && (
            <Typography variant="caption" color="success.light">
              Active session: {sessionFiles.join(', ')}
            </Typography>
          )}
          {!isTauriRuntime() && (
            <TextField
              label="Vision API URL"
              fullWidth
              size="small"
              value={config.coreApiUrl}
              onChange={(e) => onChange({ ...config, coreApiUrl: e.target.value })}
              placeholder="/api/core"
              slotProps={{ input: { sx: { fontFamily: 'monospace' } } }}
            />
          )}
          {isTauriRuntime() && bundledEnginePath && (
            <TextField
              label="Engine (bundled with app)"
              fullWidth
              size="small"
              value={bundledEnginePath}
              slotProps={{ input: { readOnly: true, sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
              helperText="Advanced: override folder name below only if you relocated the submodule."
            />
          )}
          <TextField
            label="Engine folder name (advanced)"
            fullWidth
            size="small"
            value={config.coreEnginePath}
            onChange={(e) => onChange({ ...config, coreEnginePath: e.target.value })}
            helperText={`Relative to the ${CORE_ENGINE_DIR} install inside the Aider Vision app.`}
          />
          <TextField
            label="Python (spawn API on desktop)"
            fullWidth
            size="small"
            value={config.pythonPath}
            onChange={(e) => onChange({ ...config, pythonPath: e.target.value })}
            placeholder=".venv/bin/python3"
            helperText="Leave empty to use the repo .venv (run source activate.sh once)."
          />
          <TextField
            label="Core API token (optional)"
            fullWidth
            size="small"
            type="password"
            value={config.coreApiToken}
            onChange={(e) => onChange({ ...config, coreApiToken: e.target.value })}
          />
          <TextField
            label="Auto-approve countdown"
            fullWidth
            size="small"
            type="number"
            value={config.autoApproveLimit}
            onChange={(e) =>
              onChange({ ...config, autoApproveLimit: parseInt(e.target.value, 10) || 0 })
            }
            helperText="Automatically answer Yes on the next N confirmation prompts (0 = always ask)."
          />
          <TextField
            label="Prompt before commit"
            fullWidth
            size="small"
            select
            SelectProps={{ native: true }}
            value={config.promptBeforeCommit ? 'yes' : 'no'}
            onChange={(e) => {
              const manual = e.target.value === 'yes'
              onChange({
                ...config,
                promptBeforeCommit: manual,
                autoStageOnDone: manual ? true : config.autoStageOnDone,
              })
            }}
            helperText="When enabled, the engine will not auto-commit; use the Git tab to commit."
          >
            <option value="no">Auto-commit (default)</option>
            <option value="yes">Manual commit only</option>
          </TextField>
          <TextField
            label="Auto-stage edits after turn"
            fullWidth
            size="small"
            select
            SelectProps={{ native: true }}
            value={config.autoStageOnDone ? 'yes' : 'no'}
            onChange={(e) =>
              onChange({ ...config, autoStageOnDone: e.target.value === 'yes' })
            }
            helperText="When the engine does not commit, stage edited files so the Git tab shows staged diffs (desktop)."
          >
            <option value="yes">Yes (recommended with manual commit)</option>
            <option value="no">No</option>
          </TextField>
        </Stack>
      </Paper>

      <AppearanceSection appearance={appearance} onChange={onAppearanceChange} />

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          API flow
        </Typography>
        <Typography
          component="pre"
          variant="body2"
          sx={{
            m: 0,
            fontFamily: 'monospace',
            color: 'success.light',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
          }}
        >
          {apiPreview}
        </Typography>
      </Paper>

      <Stack direction="row" spacing={1}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={onSave}>
          Save
        </Button>
        <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={onReset}>
          Reset defaults
        </Button>
      </Stack>
    </Stack>
  )
}
