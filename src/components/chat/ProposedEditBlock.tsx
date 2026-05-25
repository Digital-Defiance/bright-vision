import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Chip,
  Typography,
} from '@mui/material'
import type { AssistantContentSegment } from '../../utils/proposedEdits'

interface ProposedEditBlockProps {
  segment: Extract<AssistantContentSegment, { type: 'proposed_edit' }>
  applied: boolean
  defaultExpanded?: boolean
}

function kindLabel(kind: string): string {
  if (kind === 'search_replace') return 'SEARCH/REPLACE'
  if (kind === 'fenced_file') return 'File proposal'
  return 'Code block'
}

export function ProposedEditBlock({ segment, applied, defaultExpanded = false }: ProposedEditBlockProps) {
  return (
    <Accordion
      disableGutters
      defaultExpanded={defaultExpanded}
      sx={{
        bgcolor: 'action.hover',
        border: 1,
        borderColor: applied ? 'success.dark' : 'warning.dark',
        '&:before': { display: 'none' },
      }}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon fontSize="small" />}>
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem', flex: 1, mr: 1 }}>
          {segment.title}
        </Typography>
        <Chip
          label={applied ? 'Applied' : 'Proposed only'}
          size="small"
          color={applied ? 'success' : 'warning'}
          variant="outlined"
          sx={{ mr: 0.5, fontSize: '0.65rem', height: 22 }}
        />
        <Chip
          label={kindLabel(segment.kind)}
          size="small"
          variant="outlined"
          sx={{ fontSize: '0.65rem', height: 22 }}
        />
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 0 }}>
        {!applied && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
            Shown in chat — may not be on disk until the engine applies SEARCH/REPLACE blocks.
          </Typography>
        )}
        <Typography
          component="pre"
          variant="body2"
          sx={{
            m: 0,
            p: 1,
            bgcolor: 'background.default',
            borderRadius: 1,
            overflow: 'auto',
            fontSize: '0.75rem',
            whiteSpace: 'pre-wrap',
            maxHeight: 320,
          }}
        >
          {segment.body}
        </Typography>
      </AccordionDetails>
    </Accordion>
  )
}
