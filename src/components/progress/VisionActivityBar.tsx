import { Box, LinearProgress, Typography } from '@mui/material'
import { ThinkingTimerInline } from '../chat/ThinkingTimerBar'
import { useMonotonicEtaProgress } from '../../hooks/useMonotonicEtaProgress'
import { isTurnEtaVisible } from '../../utils/turnEtaEstimate'
import type { TurnEtaEstimate } from '../../utils/turnEtaEstimate'
import type { LiveThinkingState } from '../../utils/thinkingTiming'
import type { ProcessSnapshot } from '../../progress/types'
import './VisionActivityBar.scss'

interface VisionActivityBarProps {
  process: ProcessSnapshot
  liveTiming?: LiveThinkingState | null
  turnEta?: TurnEtaEstimate | null
}

export function VisionActivityBar({
  process,
  liveTiming = null,
  turnEta = null,
}: VisionActivityBarProps) {
  const show = process.active || process.phase === 'error' || liveTiming != null
  const etaVisible = isTurnEtaVisible(turnEta)
  const etaPct = useMonotonicEtaProgress(
    show ? turnEta : null,
    liveTiming?.responseElapsedMs ?? 0
  )

  if (!show) return null

  const indeterminate = process.progress === null
  const pct =
    process.progress !== null
      ? Math.round(Math.min(1, Math.max(0, process.progress)) * 100)
      : null

  const countLabel =
    process.current != null && process.total != null && process.total > 0
      ? `${process.current}/${process.total}`
      : null

  const phaseClass = process.active ? `vision-activity--${process.phase}` : 'vision-activity--reasoning'
  const primaryLabel = process.active
    ? process.label
    : liveTiming?.phaseLabel.toUpperCase() ?? 'WORKING'

  return (
    <Box
      className={`vision-activity ${phaseClass}`}
      role="status"
      aria-live="polite"
      aria-valuenow={pct ?? undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid="vision-activity"
      data-phase={process.active ? process.phase : 'timing'}
      data-indeterminate={indeterminate ? 'true' : 'false'}
    >
      <LinearProgress
        className="vision-activity__bar"
        variant={indeterminate ? 'indeterminate' : 'determinate'}
        value={pct ?? 0}
        sx={{
          height: 6,
          borderRadius: 999,
          bgcolor: 'action.hover',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            background: (theme) =>
              process.phase === 'error'
                ? `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`
                : `linear-gradient(90deg, #7c3aed, #22d3ee)`,
          },
        }}
      />
      <Box className="vision-activity__meta">
        <Box className="vision-activity__meta-primary">
          <Typography variant="caption" className="vision-activity__label" component="span">
            {primaryLabel}
            {pct != null && (
              <Box component="span" className="vision-activity__pct" sx={{ ml: 1 }}>
                {pct}%
              </Box>
            )}
          </Typography>
          {(process.detail || countLabel) && (
            <Typography variant="caption" className="vision-activity__detail" component="span">
              {countLabel && process.detail
                ? `${countLabel} · ${process.detail}`
                : countLabel || process.detail}
            </Typography>
          )}
        </Box>
        {(liveTiming || (etaVisible && etaPct != null)) && (
          <Box className="vision-activity__meta-trailing">
            {liveTiming && <ThinkingTimerInline live={liveTiming} eta={turnEta} />}
            {etaVisible && etaPct != null && (
              <LinearProgress
                className="vision-activity__bar vision-activity__bar--eta"
                variant="determinate"
                value={etaPct}
                data-testid="vision-activity-eta"
                aria-label="Estimated time remaining"
                sx={{
                  flex: '1 1 120px',
                  minWidth: 80,
                  maxWidth: 280,
                  height: 4,
                  borderRadius: 999,
                  bgcolor: 'action.hover',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 999,
                    transition: 'transform 0.4s ease-out',
                    background: (theme) =>
                      `linear-gradient(90deg, ${theme.palette.success.dark}, ${theme.palette.success.main})`,
                  },
                }}
              />
            )}
          </Box>
        )}
      </Box>
    </Box>
  )
}
