// @ts-nocheck
import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { HelmetProvider } from 'react-helmet-async'
import theme from '../styles/theme'

export function renderWithRouter(ui: React.ReactElement, options = {}) {
  return render(
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>,
    options,
  )
}

export * from '@testing-library/react'
export { renderWithRouter as render }
