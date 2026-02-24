import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { HelmetProvider } from 'react-helmet-async'
import App from '../App'
import theme from '../styles/theme'

function renderAt(path: string) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </MemoryRouter>
    </HelmetProvider>
  )
}

describe('App routing', () => {
  it('renders Landing at /', () => {
    renderAt('/')
    expect(screen.getByText('Achieve all your goals in one place')).toBeTruthy()
  })

  it('renders ProductsPage at /products', async () => {
    renderAt('/products')
    await waitFor(() => {
      expect(screen.getByText('Itinerary Feed')).toBeTruthy()
      expect(screen.getByText('Video Feed')).toBeTruthy()
    })
  })

  it('renders PricingPage at /pricing', async () => {
    renderAt('/pricing')
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pricing' })).toBeTruthy()
    })
  })
})
