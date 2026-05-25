import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd'
import {
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'

export interface SuggestedFilesTrayProps {
  paths: string[]
  disabled?: boolean
  onAddOne: (path: string) => void
  onAddAll: () => void
  onQueueAdds: () => void
  onDismiss: (path: string) => void
  onClearAll: () => void
}

export function SuggestedFilesTray({
  paths,
  disabled = false,
  onAddOne,
  onAddAll,
  onQueueAdds,
  onDismiss,
  onClearAll,
}: SuggestedFilesTrayProps) {
  if (paths.length === 0) return null

  return (
    <Box
      data-testid="suggested-files-tray"
      sx={{
        px: 1,
        pt: 0.5,
        pb: 0,
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: 'action.hover',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary" component="span">
          Suggested files ({paths.length})
        </Typography>
        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            variant="text"
            disabled={disabled}
            onClick={onClearAll}
            data-testid="suggested-files-clear"
          >
            Clear
          </Button>
          <Button
            size="small"
            variant="outlined"
            disabled={disabled}
            startIcon={<AddIcon fontSize="small" />}
            onClick={onAddAll}
            data-testid="suggested-files-add-all"
          >
            Add all
          </Button>
          <Button
            size="small"
            variant="contained"
            disabled={disabled}
            startIcon={<PlaylistAddIcon fontSize="small" />}
            onClick={onQueueAdds}
            data-testid="suggested-files-queue-adds"
          >
            Queue /add
          </Button>
        </Stack>
      </Stack>
      <Stack direction="row" flexWrap="wrap" gap={0.5} useFlexGap>
        {paths.map((path) => (
          <Tooltip key={path} title="Click to add · × to dismiss">
            <Chip
              size="small"
              label={path}
              disabled={disabled}
              clickable={!disabled}
              onClick={() => onAddOne(path)}
              data-testid={`suggested-file-chip-${path.replace(/\//g, '--')}`}
              onDelete={disabled ? undefined : () => onDismiss(path)}
              deleteIcon={
                <IconButton size="small" aria-label={`Dismiss ${path}`}>
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{
                maxWidth: '100%',
                '& .MuiChip-label': { fontFamily: 'monospace', fontSize: '0.75rem' },
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    </Box>
  )
}
