import RefreshIcon from '@mui/icons-material/Refresh'
import { Alert, Button, Stack, Typography } from '@mui/material'

export interface EmptyLlmWarningProps {
  message: string
  lastUserMessage: string | null
  disabled?: boolean
  onRetry: (mode: 'exact' | 'nudge') => void
  onDismiss: () => void
}

export function EmptyLlmWarning({
  message,
  lastUserMessage,
  disabled = false,
  onRetry,
  onDismiss,
}: EmptyLlmWarningProps) {
  return (
    <Alert
      severity="warning"
      sx={{ mb: 1 }}
      data-testid="empty-llm-warning"
      onClose={onDismiss}
    >
      <Typography variant="body2" component="div" sx={{ mb: 1 }}>
        {message}
      </Typography>
      {lastUserMessage && (
        <Typography
          variant="caption"
          color="text.secondary"
          component="div"
          sx={{ mb: 1, fontFamily: 'monospace', wordBreak: 'break-word' }}
        >
          Last message: {lastUserMessage.length > 120 ? `${lastUserMessage.slice(0, 120)}…` : lastUserMessage}
        </Typography>
      )}
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        <Button
          size="small"
          variant="contained"
          disabled={disabled || !lastUserMessage}
          startIcon={<RefreshIcon fontSize="small" />}
          onClick={() => onRetry('exact')}
          data-testid="empty-llm-retry-exact"
        >
          Retry
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled || !lastUserMessage}
          onClick={() => onRetry('nudge')}
          data-testid="empty-llm-retry-nudge"
        >
          Retry with hint
        </Button>
      </Stack>
    </Alert>
  )
}
