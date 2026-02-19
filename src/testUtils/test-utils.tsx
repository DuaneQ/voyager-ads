// @ts-nocheck
import React from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

export function renderWithRouter(ui: React.ReactElement, options = {}) {
  return render(<MemoryRouter>{ui}</MemoryRouter>, options)
}

export * from '@testing-library/react'
