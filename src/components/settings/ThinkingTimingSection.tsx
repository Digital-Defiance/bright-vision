import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { Box, Button, FormControlLabel, Paper, Stack, Switch, Typography } from '@mui/material'
import type { ModelThinkingSummary } from '../../utils/thinkingStats'
import {
  DEFAULT_THINKING_TIMING_PREFS,
  type ThinkingTimingPrefs,
} from '../../theme/thinkingTimingPrefs'
import { formatDurationMs } from '../../utils/thinkingTiming'

interface ThinkingTimingSectionProps {
  prefs: ThinkingTimingPrefs
  modelSummary: ModelThinkingSummary | null
  currentModel: string
  onChange: (next: ThinkingTimingPrefs) => void
  onClearModelStats: () => void
}

export function ThinkingTimingSection({
  prefs,
  modelSummary,
  currentModel,
  onChange,
  onClearModelStats,
}: ThinkingTimingSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Thinking timers
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Track elapsed time per assistant section (Thinking / Reasoning / Answer) during each turn.
        Stats accumulate per LLM model vs. prompt size.
      </Typography>
      <Stack spacing={0.5}>
        <FormControlLabel
          control={
            <Switch
              checked={prefs.showLiveTimer}
              onChange={(_, v) => onChange({ ...prefs, showLiveTimer: v })}
            />
          }
          label="Live timer while agent is working"
        />
        <FormControlLabel
          control={
            <Switch
              checked={prefs.showSectionDurations}
              onChange={(_, v) => onChange({ ...prefs, showSectionDurations: v })}
            />
          }
          label="Section duration on completed messages"
        />
        <FormControlLabel
          control={
            <Switch
              checked={prefs.showMessageTurnTotal}
              onChange={(_, v) => onChange({ ...prefs, showMessageTurnTotal: v })}
            />
          }
          label="Total turn time on assistant messages"
        />
        <FormControlLabel
          control={
            <Switch
              checked={prefs.showStatsInSettings}
              onChange={(_, v) => onChange({ ...prefs, showStatsInSettings: v })}
            />
          }
          label="Show model averages here"
        />
        <Button
          size="small"
          sx={{ alignSelf: 'flex-start', mt: 0.5 }}
          onClick={() => onChange({ ...DEFAULT_THINKING_TIMING_PREFS })}
        >
          Reset display defaults
        </Button>
      </Stack>
      {prefs.showStatsInSettings && (
        <Box sx={{ mt: 2, p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Model: <strong>{currentModel || 'unknown'}</strong>
          </Typography>
          {modelSummary ? (
            <Stack spacing={0.25}>
              <Typography variant="body2">
                Avg thought time: {formatDurationMs(modelSummary.avgThoughtMs)} (
                {modelSummary.sampleCount} turn{modelSummary.sampleCount === 1 ? '' : 's'})
              </Typography>
              <Typography variant="body2">
                Avg turn time: {formatDurationMs(modelSummary.avgTurnMs)}
              </Typography>
              {modelSummary.avgMsPer1kChars != null && (
                <Typography variant="body2">
                  ~{formatDurationMs(modelSummary.avgMsPer1kChars)} thought per 1k prompt chars
                </Typography>
              )}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No samples yet — complete a turn with Thinking/Reasoning sections.
            </Typography>
          )}
          <Button
            size="small"
            color="inherit"
            startIcon={<DeleteOutlineIcon />}
            sx={{ mt: 1 }}
            onClick={onClearModelStats}
            disabled={!modelSummary}
          >
            Clear stats for this model
          </Button>
        </Box>
      )}
    </Paper>
  )
}
