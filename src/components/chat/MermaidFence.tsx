import { Box, Typography } from '@mui/material'
import { useEffect, useId, useState } from 'react'

interface MermaidFenceProps {
  source: string
  complete: boolean
}

export function MermaidFence({ source, complete }: MermaidFenceProps) {
  const id = useId().replace(/:/g, '')
  const [svg, setSvg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!complete || !source.trim()) {
      setSvg(null)
      setError(null)
      return
    }
    let cancelled = false
    void (async () => {
      try {
        const mermaid = (await import('mermaid')).default
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'strict',
          fontFamily: 'ui-sans-serif, system-ui, sans-serif',
        })
        const { svg: rendered } = await mermaid.render(`vision-mmd-${id}`, source.trim())
        if (!cancelled) {
          setSvg(rendered)
          setError(null)
        }
      } catch (err) {
        if (!cancelled) {
          setSvg(null)
          setError(err instanceof Error ? err.message : String(err))
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [source, complete, id])

  if (!complete) {
    return (
      <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        Diagram loading…
      </Typography>
    )
  }

  if (error) {
    return (
      <Typography variant="caption" color="warning.main" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
        {error}
      </Typography>
    )
  }

  if (!svg) {
    return (
      <Typography variant="caption" color="text.secondary">
        Rendering diagram…
      </Typography>
    )
  }

  return (
    <Box
      className="vision-chat-mermaid"
      sx={{
        overflow: 'auto',
        maxHeight: 420,
        '& svg': { maxWidth: '100%', height: 'auto' },
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
      data-testid="chat-mermaid-diagram"
    />
  )
}
