import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../../testUtils/test-utils'
import Landing from '../../pages/Landing'

describe('Landing page', () => {
  it('renders features grid and TravalPass power section', () => {
    render(<Landing />)
    expect(screen.getByText('Achieve all your goals in one place')).toBeTruthy()
    expect(screen.getByText('The power of TravalPass Ads, for your business')).toBeTruthy()
  })

  it('renders the Questions section with two items', () => {
    render(<Landing />)
    expect(screen.getByText('Questions?')).toBeTruthy()
    expect(screen.getByText('How do TravalPass Ads work?')).toBeTruthy()
    expect(screen.getByText('How can TravalPass Ads help my business?')).toBeTruthy()
  })

  it('opens the "How do Ads work" modal on click', () => {
    render(<Landing />)
    fireEvent.click(screen.getByText('How do TravalPass Ads work?'))
    expect(screen.getByRole('dialog')).toBeTruthy()
    // modal title
    const dialog = screen.getByRole('dialog')
    expect(dialog.textContent).toContain('How do TravalPass Ads work?')
  })

  it('closes the "How do Ads work" modal on close', async () => {
    render(<Landing />)
    fireEvent.click(screen.getByText('How do TravalPass Ads work?'))
    fireEvent.click(screen.getByLabelText(/close/i))
    // MUI Dialog has exit animations — waitFor lets React flush the transition
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('opens the "Help my business" modal on click', () => {
    render(<Landing />)
    fireEvent.click(screen.getByText('How can TravalPass Ads help my business?'))
    expect(screen.getByRole('dialog')).toBeTruthy()
  })

  it('renders the FAQ section', () => {
    render(<Landing />)
    expect(screen.getByText('Frequently asked questions')).toBeTruthy()
    expect(screen.getByText('What are the different types of TravalPass Ads campaigns I can run?')).toBeTruthy()
    expect(screen.getByText('How can I use TravalPass Ads to reach potential customers?')).toBeTruthy()
  })

  it('FAQ answer is hidden by default', () => {
    render(<Landing />)
    const answer = screen.getByText(/TravalMatch \(swipe\) placements/)
    // The answer container has hidden attribute when collapsed
    expect(answer.closest('[hidden]')).toBeTruthy()
  })

  it('FAQ opens item when clicked and shows bullet list', () => {
    render(<Landing />)
    const btn = screen.getByRole('button', { name: /What are the different types/i })
    expect(btn.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(btn)
    expect(btn.getAttribute('aria-expanded')).toBe('true')
    // Answer is now visible (no hidden attribute)
    const container = btn.nextElementSibling
    expect(container?.hasAttribute('hidden')).toBe(false)
  })

  it('FAQ closes item when clicked again (toggle)', () => {
    render(<Landing />)
    const btn = screen.getByRole('button', { name: /What are the different types/i })
    fireEvent.click(btn) // open
    fireEvent.click(btn) // close
    expect(btn.getAttribute('aria-expanded')).toBe('false')
  })

  it('FAQ second item shows a paragraph (string answer)', () => {
    render(<Landing />)
    const btn = screen.getByRole('button', { name: /How can I use TravalPass Ads/i })
    fireEvent.click(btn)
    expect(screen.getByText(/TravalPass helps you reach travelers/)).toBeTruthy()
  })

  it('renders the footer with current year', () => {
    render(<Landing />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeTruthy()
  })
})
