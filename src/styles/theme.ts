import { createTheme } from '@mui/material/styles'

/**
 * Single source of truth for all design tokens.
 * Update values here — every MUI component inherits them automatically.
 */
const theme = createTheme({
  palette: {
    primary: {
      main: '#1a73e8',
      dark: '#1558b0',
    },
    text: {
      primary: '#213547',
      secondary: 'rgba(33, 53, 71, 0.7)',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    divider: '#e6e6e6',
  },
  typography: {
    fontFamily: 'system-ui, Avenir, Helvetica, Arial, sans-serif',
    h1: { fontSize: '3.2rem', lineHeight: 1.1 },
    h2: { fontSize: '1.5rem' },
    h3: { fontSize: '1.25rem' },
    body1: { lineHeight: 1.5 },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8, // 1 unit = 8px — use theme.spacing(2) = 16px
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#1a73e8',
          textDecoration: 'none',
          '&:hover': { color: '#1558b0' },
        },
      },
    },
  },
})

export default theme
