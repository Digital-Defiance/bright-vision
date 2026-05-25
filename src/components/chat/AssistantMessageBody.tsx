import { Box, Chip, Stack, Typography } from '@mui/material'
import { splitAssistantSections } from '../../utils/chatStream'
import {
  isProposedEditApplied,
  parseAssistantContent,
  type AssistantContentSegment,
} from '../../utils/proposedEdits'
import { ProposedEditBlock } from './ProposedEditBlock'

function sectionLabel(kind: string): string {
  if (kind === 'thinking') return 'Thinking'
  if (kind === 'answer') return 'Answer'
  if (kind === 'reasoning') return 'Reasoning'
  return ''
}

function renderSegment(
  seg: AssistantContentSegment,
  key: string,
  appliedFiles: string[]
) {
  if (seg.type === 'prose') {
    const text = seg.content.trim()
    if (!text) return null
    return (
      <Typography key={key} variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
        {seg.content}
      </Typography>
    )
  }
  const applied = isProposedEditApplied(seg.title, appliedFiles)
  return (
    <ProposedEditBlock
      key={key}
      segment={seg}
      applied={applied}
      defaultExpanded={!applied && seg.kind === 'search_replace'}
    />
  )
}

interface AssistantMessageBodyProps {
  content: string
  appliedFiles?: string[]
}

export function AssistantMessageBody({ content, appliedFiles = [] }: AssistantMessageBodyProps) {
  return (
    <Stack spacing={1} sx={{ pr: 3 }}>
      {splitAssistantSections(content).map((sec, si) => (
        <Box key={si}>
          {sectionLabel(sec.kind) && (
            <Chip
              label={sectionLabel(sec.kind)}
              size="small"
              variant="outlined"
              sx={{ mb: 0.5, fontSize: '0.7rem' }}
            />
          )}
          <Stack spacing={1}>
            {parseAssistantContent(sec.content).map((seg, i) =>
              renderSegment(seg, `${si}-${i}`, appliedFiles)
            )}
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}
