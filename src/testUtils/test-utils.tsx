// @ts-nocheck
import React from 'react'
import { render } from '@testing-library/react'

export function renderWithRouter(ui: React.ReactElement, options = {}) {
  // Keep simple wrapper — don't require react-router-dom in tests
  return render(ui, options)
}

export * from '@testing-library/react'
