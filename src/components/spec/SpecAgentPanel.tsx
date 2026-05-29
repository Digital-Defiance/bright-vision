import ArticleIcon from '@mui/icons-material/Article'
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import FactCheckIcon from '@mui/icons-material/FactCheck'
import HubIcon from '@mui/icons-material/Hub'
import SendIcon from '@mui/icons-material/Send'
import StopIcon from '@mui/icons-material/Stop'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useRef } from 'react'
import type { ChatMessage } from '../chat/ChatPanel'
import { AssistantMessageBody } from '../chat/AssistantMessageBody'
import type { TodoItem } from '../../todos/types'

export interface SpecAgentPanelProps {
  messages: ChatMessage[]
  inputValue: string
  isRunning: boolean
  isBusy: boolean
  sessionReady: boolean
  activeTodo: TodoItem | null
  specGenerating?: boolean
  earsLinting?: boolean
  specTracing?: boolean
  chatEndRef: React.RefObject<HTMLDivElement>
  onInputChange: (value: string) => void
  onSend: () => void
  onCancelSend: () => void
  onOpenTasks: () => void
  onGenerateSpec?: () => void
  onRefineSpec?: () => void
  onValidateEars?: () => void
  onTraceSpec?: () => void
  onClearHistory?: () => void
}

export function SpecAgentPanel({
  messages,
  inputValue,
  isRunning,
  isBusy,
  sessionReady,
  activeTodo,
  specGenerating,
  earsLinting,
  specTracing,
  chatEndRef,
  onInputChange,
  onSend,
  onCancelSend,
  onOpenTasks,
  onGenerateSpec,
  onRefineSpec,
  onValidateEars,
  onTraceSpec,
  onClearHistory,
}: SpecAgentPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Box
      data-testid="spec-agent-panel"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 1, gap: 1 }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" useFlexGap>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ArticleIcon color="primary" fontSize="small" />
          <Typography variant="subtitle1" fontWeight={600}>
            Spec agent
          </Typography>
          {activeTodo ? (
            <Chip size="small" label={activeTodo.title} data-testid="spec-agent-active-task" />
          ) : (
            <Chip size="small" color="warning" label="No active task" />
          )}
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button size="small" onClick={onOpenTasks}>
            Tasks
          </Button>
          {onClearHistory && messages.length > 0 && (
            <Button size="small" onClick={onClearHistory}>
              Clear
            </Button>
          )}
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ py: 0.5 }}>
        Spec-only thread: steering + active task spec, no slash preproc. Use Tasks for layer edits;
        implementation chat stays on the Chat tab.
      </Alert>

      {!activeTodo && (
        <Alert severity="warning">
          Set an <strong>active task</strong> on the Tasks tab before using the spec agent.
        </Alert>
      )}

      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {onGenerateSpec && (
          <Button
            size="small"
            startIcon={specGenerating ? <CircularProgress size={14} /> : <AutoAwesomeIcon />}
            disabled={!sessionReady || !activeTodo || specGenerating}
            onClick={onGenerateSpec}
            data-testid="spec-agent-generate"
          >
            Generate
          </Button>
        )}
        {onRefineSpec && (
          <Button
            size="small"
            disabled={!sessionReady || !activeTodo || specGenerating}
            onClick={onRefineSpec}
            data-testid="spec-agent-refine"
          >
            Refine
          </Button>
        )}
        {onValidateEars && (
          <Button
            size="small"
            startIcon={earsLinting ? <CircularProgress size={14} /> : <FactCheckIcon />}
            disabled={!sessionReady || !activeTodo || earsLinting}
            onClick={onValidateEars}
            data-testid="spec-agent-validate-ears"
          >
            Validate EARS
          </Button>
        )}
        {onTraceSpec && (
          <Button
            size="small"
            startIcon={specTracing ? <CircularProgress size={14} /> : <HubIcon />}
            disabled={!sessionReady || !activeTodo || specTracing}
            onClick={onTraceSpec}
            data-testid="spec-agent-trace"
          >
            Trace
          </Button>
        )}
      </Stack>

      <Paper
        variant="outlined"
        sx={{
          flex: 1,
          minHeight: 0,
          overflow: 'auto',
          p: 1.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {messages.length === 0 && (
          <Typography variant="body2" color="text.secondary" data-testid="spec-agent-empty">
            Ask for EARS rewrites, design alignment, or task breakdown. Example: “Add REQ-003 for
            offline mode and sync design.md.”
          </Typography>
        )}
        {messages.map((m) => (
          <Box
            key={m.id}
            data-testid={m.role === 'user' ? 'spec-agent-user' : 'spec-agent-assistant'}
            sx={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '92%',
            }}
          >
            {m.role === 'user' ? (
              <Paper sx={{ px: 1.5, py: 1, bgcolor: 'primary.dark' }}>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </Typography>
              </Paper>
            ) : (
              <AssistantMessageBody content={m.content} />
            )}
          </Box>
        ))}
        <div ref={chatEndRef} />
      </Paper>

      <Stack direction="row" spacing={1} alignItems="flex-end">
        <TextField
          inputRef={inputRef}
          fullWidth
          inputProps={{ 'data-testid': 'spec-agent-input' }}
          multiline
          minRows={2}
          maxRows={6}
          size="small"
          placeholder={
            activeTodo
              ? 'Spec question or refinement…'
              : 'Select an active task first'
          }
          value={inputValue}
          disabled={!isRunning || !activeTodo}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
          }}
        />
        {isBusy ? (
          <IconButton color="error" onClick={onCancelSend} aria-label="Stop" data-testid="spec-agent-stop">
            <StopIcon />
          </IconButton>
        ) : (
          <IconButton
            color="primary"
            onClick={onSend}
            disabled={!isRunning || !activeTodo || !inputValue.trim()}
            aria-label="Send"
            data-testid="spec-agent-send"
          >
            <SendIcon />
          </IconButton>
        )}
      </Stack>
    </Box>
  )
}
