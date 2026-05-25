import { Box, LinearProgress, Typography } from '@mui/material'
import type { ProcessSnapshot } from '../../progress/types'
import './VisionActivityBar.scss'

interface VisionActivityBarProps {
  process: ProcessSnapshot
}

export function VisionActivityBar({ process }: VisionActivityBarProps) {
  const show = process.active || process.phase === 'error'
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

  const phaseClass = `vision-activity--${process.phase}`

  return (
    <Box
      className={`vision-activity ${phaseClass}`}
      role="status"
      aria-live="polite"
      aria-valuenow={pct ?? undefined}
      aria-valuemin={0}
      aria-valuemax={100}
      data-testid="vision-activity"
      data-phase={process.phase}
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
        <Typography variant="caption" className="vision-activity__label" component="span">
          {process.label}
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
    </Box>
  )
}
