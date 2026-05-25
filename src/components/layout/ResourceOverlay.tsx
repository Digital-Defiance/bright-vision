import { Box, Typography } from '@mui/material'
import { VISION_SIDEBAR_W } from './AppChrome'
import {
  formatResourceOverlayLine,
  type ResourceSnapshot,
} from '../../ipc/resourceSnapshot'
import type { ResourceOverlayPrefs } from '../../theme/resourceOverlayPrefs'

interface ResourceOverlayProps {
  snapshot: ResourceSnapshot
  prefs: ResourceOverlayPrefs
}

export function ResourceOverlay({ snapshot, prefs }: ResourceOverlayProps) {
  const warn = snapshot.cpuPct >= prefs.warnCpuPct
  const line = formatResourceOverlayLine(snapshot, prefs.showGpu)

  return (
    <Box
      data-testid="resource-overlay"
      role="status"
      aria-live="polite"
      sx={{
        position: 'fixed',
        left: VISION_SIDEBAR_W + 12,
        bottom: 12,
        zIndex: 1200,
        pointerEvents: 'none',
        px: 1.25,
        py: 0.5,
        borderRadius: 1,
        border: 1,
        borderColor: warn ? 'warning.main' : 'divider',
        bgcolor: 'rgba(15, 15, 20, 0.82)',
        backdropFilter: 'blur(6px)',
        fontFamily: 'var(--vision-font-terminal, monospace)',
        fontSize: '0.7rem',
        color: warn ? 'warning.light' : 'text.secondary',
        boxShadow: warn
          ? '0 0 12px rgba(251, 191, 36, 0.25)'
          : '0 2px 8px rgba(0,0,0,0.35)',
      }}
    >
      <Typography component="span" variant="caption" sx={{ fontSize: 'inherit' }}>
        {line}
      </Typography>
      <Typography
        component="span"
        variant="caption"
        sx={{ display: 'block', fontSize: '0.62rem', opacity: 0.75, mt: 0.25 }}
      >
        {snapshot.memUsedMb} / {snapshot.memTotalMb} MB · {snapshot.scope}
      </Typography>
    </Box>
  )
}
