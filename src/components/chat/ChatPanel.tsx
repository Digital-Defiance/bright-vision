import SendIcon from '@mui/icons-material/Send'
import { Box, Button, Container, Paper, Stack, TextField, Typography, Alert } from '@mui/material'
import { DISPLAY_CORE } from '../../brand'
import type { VisionCommand } from '../../ipc/commands'
import { ConfirmBanner } from '../ConfirmBanner'
import { CommandAssist } from './CommandAssist'
import type { CoreConfirmEvent } from '../../ipc/events'

export interface ChatMessage {
  id: number
  role: 'user' | 'assistant' | 'system'
  content: string
}

export interface ToolEvent {
  id: number
  type: 'tool_call' | 'tool_result' | 'tool_warning'
  name?: string
  input?: string
  output?: string
}

interface ChatPanelProps {
  messages: ChatMessage[]
  toolEvents: ToolEvent[]
  inputValue: string
  isRunning: boolean
  isBusy: boolean
  pendingConfirm: CoreConfirmEvent | null
  chatEndRef: React.RefObject<HTMLDivElement>
  onInputChange: (value: string) => void
  onSend: () => void
  onDismissConfirm: () => void
  commands: VisionCommand[]
  onPickCommand: (command: string) => void
}

export function ChatPanel({
  messages,
  toolEvents,
  inputValue,
  isRunning,
  isBusy,
  pendingConfirm,
  chatEndRef,
  onInputChange,
  onSend,
  onDismissConfirm,
  commands,
  onPickCommand,
}: ChatPanelProps) {
  // Filter out empty tool outputs and noise to prevent duplication/clutter
  const meaningfulToolEvents = toolEvents.filter(
    (t) => t.output?.trim() || t.type === 'tool_call'
  )

  return (
    <Container maxWidth="md" disableGutters sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {pendingConfirm && <ConfirmBanner confirm={pendingConfirm} onDismiss={onDismissConfirm} />}
      {isBusy && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          Agent is working — see the pulse bar above.
        </Typography>
      )}
      <Box sx={{ flex: 1, overflow: 'auto', mb: 2, p: 1 }}>
        {messages.length === 0 && meaningfulToolEvents.length === 0 && (
          <Paper variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Start {DISPLAY_CORE} from the Terminal tab, then chat here.
            </Typography>
          </Paper>
        )}
        <Stack spacing={2}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <Paper
                sx={{
                  px: 2,
                  py: 1.5,
                  maxWidth: '85%',
                  bgcolor:
                    msg.role === 'user'
                      ? 'primary.dark'
                      : msg.role === 'system'
                        ? 'warning.dark'
                        : 'background.paper',
                  border: msg.role === 'assistant' ? 1 : 0,
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Typography>
              </Paper>
            </Box>
          ))}
          
          {/* Group tool events logically with distinct styling */}
          {meaningfulToolEvents.map((tool) => (
            <Box key={tool.id} sx={{ width: '100%' }}>
              {tool.type === 'tool_warning' ? (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  <Typography variant="body2" component="span" fontWeight="bold">
                    {tool.name || 'Warning'}: 
                  </Typography>
                  <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                    {tool.output}
                  </Typography>
                </Alert>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{ 
                    p: 2, 
                    maxWidth: '90%', 
                    fontFamily: 'monospace', 
                    fontSize: '0.85rem',
                    bgcolor: 'action.hover'
                  }}
                >
                  <Typography variant="caption" color="primary.main" display="block" gutterBottom fontWeight="bold">
                    {tool.type === 'tool_call' ? '🛠 Calling' : '✅ Result'}: {tool.name || 'tool'}
                  </Typography>
                  {(tool.input || tool.output) && (
                    <Typography component="pre" variant="body2" sx={{ m: 0, whiteSpace: 'pre-wrap', overflowX: 'auto' }}>
                      {tool.input || tool.output}
                    </Typography>
                  )}
                </Paper>
              )}
            </Box>
          ))}
        </Stack>
        <div ref={chatEndRef} />
      </Box>
      
      <CommandAssist
        commands={commands}
        inputValue={inputValue}
        disabled={!isRunning || isBusy}
        onPickCommand={onPickCommand}
      />
      
      <Stack direction="row" spacing={1} sx={{ p: 1 }}>
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={6}
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              onSend()
            }
            if (e.key === 'Tab' && inputValue.trim().startsWith('/')) {
              const token = inputValue.trim().split(/\s/)[0] ?? ''
              const match = commands.find((c) => c.name.toLowerCase().startsWith(token.toLowerCase()))
              if (match && match.name !== token) {
                e.preventDefault()
                onPickCommand(match.name + (inputValue.includes(' ') ? inputValue.slice(token.length) : ' '))
              }
            }
          }}
          placeholder={isRunning ? `Message ${DISPLAY_CORE}...` : `Start ${DISPLAY_CORE} to chat...`}
          disabled={!isRunning || isBusy}
        />
        <Button
          variant="contained"
          endIcon={<SendIcon />}
          onClick={onSend}
          disabled={!isRunning || isBusy || !inputValue.trim()}
          sx={{ alignSelf: 'flex-end' }}
        >
          Send
        </Button>
      </Stack>
    </Container>
  )
}
