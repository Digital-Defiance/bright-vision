import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import { Alert, Box, Link, Paper, Stack, Typography } from '@mui/material'
import type { SubAgentInfo } from '../../ipc/agentCommands'

const CECLI_AGENT_DOCS =
  'https://github.com/Digital-Defiance/BrightVision-core/blob/main/cecli/website/docs/config/agent-mode.md'
const CECLI_SUBAGENT_DOCS =
  'https://github.com/Digital-Defiance/BrightVision-core/blob/main/cecli/website/docs/config/subagents.md'

interface AgentsSectionProps {
  subagents: SubAgentInfo[]
  agentModeAvailable: boolean
  sessionActive: boolean
}

export function AgentsSection({
  subagents,
  agentModeAvailable,
  sessionActive,
}: AgentsSectionProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }} data-testid="settings-agents-section">
      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
        Agents &amp; sub-agents
      </Typography>
      <Typography variant="body2" color="text.secondary" paragraph>
        Cecli uses cecli <strong>agent mode</strong> and optional{' '}
        <strong>sub-agents</strong> defined as <code>*.md</code> files with YAML front matter.
        Chat exposes slash commands; register agents in your project{' '}
        <code>.cecli.conf.yml</code> (see core docs).
      </Typography>

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="caption" color="text.secondary" component="div">
          <strong>Chat shortcuts</strong> — <code>/agent</code>,{' '}
          <code>/invoke-agent &lt;name&gt; &lt;prompt&gt;</code>,{' '}
          <code>/spawn-agent &lt;name&gt;</code>, <code>/reap-agent</code>
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div">
          Example sub-agent file (<code>.cecli/subagents/reviewer.md</code>):
        </Typography>
        <Box
          component="pre"
          sx={{
            m: 0,
            p: 1.25,
            fontSize: '0.72rem',
            bgcolor: 'action.hover',
            borderRadius: 1,
            overflow: 'auto',
          }}
        >
          {`---
name: reviewer
model: ollama_chat/qwen3.6:27b-q4_K_M
---
You are a code review specialist…`}
        </Box>
      </Stack>

      {!sessionActive && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Start a session on the Terminal tab to load the sub-agent registry from the engine.
        </Alert>
      )}

      {sessionActive && !agentModeAvailable && subagents.length === 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No sub-agents registered. Add <code>agent-config.subagent_paths</code> to your cecli
          config and place <code>.md</code> definitions there, then restart the session.
        </Alert>
      )}

      {subagents.length > 0 && (
        <Stack spacing={0.75} sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Loaded for this session ({subagents.length}):
          </Typography>
          {subagents.map((a) => (
            <Typography key={a.name} variant="body2" sx={{ fontFamily: 'monospace' }}>
              <strong>{a.name}</strong>
              {a.model ? ` · ${a.model}` : ''}
              {a.prompt_preview ? (
                <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                  — {a.prompt_preview.slice(0, 80)}
                  {a.prompt_preview.length > 80 ? '…' : ''}
                </Box>
              ) : null}
            </Typography>
          ))}
        </Stack>
      )}

      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
        <Link href={CECLI_AGENT_DOCS} target="_blank" rel="noopener noreferrer" variant="body2">
          Agent mode docs <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
        </Link>
        <Link href={CECLI_SUBAGENT_DOCS} target="_blank" rel="noopener noreferrer" variant="body2">
          Sub-agents docs <OpenInNewIcon sx={{ fontSize: 14, verticalAlign: 'middle' }} />
        </Link>
      </Stack>
    </Paper>
  )
}
