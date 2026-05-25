import { Typography } from '@mui/material'
import type { LiveThinkingState } from '../../hooks/useThinkingTiming'
import { formatSinceMs } from '../../utils/sessionStall'
import { formatDurationMs } from '../../utils/thinkingTiming'

interface ThinkingTimerBarProps {
  live: LiveThinkingState
  lastEventAgoMs?: number | null
}

export function ThinkingTimerBar({ live, lastEventAgoMs }: ThinkingTimerBarProps) {
  return (
    <Typography
      data-testid="thinking-timer"
      variant="caption"
      color="text.secondary"
      sx={{
        px: 1,
        py: 0.5,
        fontSize: '0.7rem',
        borderTop: 1,
        borderColor: 'divider',
        fontFamily: 'var(--vision-font-chat, monospace)',
      }}
    >
      {live.activeLabel}{' '}
      <Typography component="span" variant="caption" color="primary.light">
        {formatDurationMs(live.activeElapsedMs)}
      </Typography>
      {' · turn '}
      {formatDurationMs(live.turnElapsedMs)}
      {lastEventAgoMs != null && (
        <>
          {' · last event '}
          {formatSinceMs(lastEventAgoMs)}
        </>
      )}
    </Typography>
  )
}
