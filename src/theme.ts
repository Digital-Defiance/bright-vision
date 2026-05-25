import { createTheme, type Theme } from '@mui/material/styles'
import { FONT_PRESET_CSS } from './theme/appearance'

/** Dark-first Vision theme — distinct from VS Code; tuned for long coding sessions. */
export function createVisionTheme(uiFontFamily = FONT_PRESET_CSS.inter): Theme {
  return createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#8b5cf6',
      dark: '#7c3aed',
      light: '#a78bfa',
    },
    secondary: {
      main: '#94a3b8',
    },
    success: {
      main: '#22c55e',
    },
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e0b',
    },
    background: {
      default: '#0f1419',
      paper: '#1a2332',
    },
    divider: '#2d3a4f',
  },
  typography: {
    fontFamily: uiFontFamily,
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          margin: 0,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
    },
  },
  })
}

/** @deprecated use createVisionTheme() — default Inter UI stack */
export const visionTheme = createVisionTheme()
