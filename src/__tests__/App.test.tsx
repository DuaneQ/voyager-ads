import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from '../App'
import theme from '../styles/theme'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </MemoryRouter>
  )
}

describe('App routing', () => {
  it('renders Landing at /', () => {
    renderAt('/')
    expect(screen.getByText('Achieve all your goals in one place')).toBeTruthy()
  })

  it('renders ProductsPage at /products', () => {
    renderAt('/products')
    expect(screen.getByText('Itinerary Feed')).toBeTruthy()
    expect(screen.getByText('Video Feed')).toBeTruthy()
  })

  it('renders PricingPage at /pricing', () => {
    renderAt('/pricing')
    expect(screen.getByRole('heading', { name: 'Pricing' })).toBeTruthy()
  })
})
