import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepDetails from '../../../components/campaign/StepDetails'
import { EMPTY_DRAFT } from '../../../types/campaign'

const makePatch = () => vi.fn()

describe('StepDetails', () => {
  it('renders the campaign name field', () => {
    render(<StepDetails draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Campaign name/i)).toBeInTheDocument()
  })

  it('renders all three placement options', () => {
    render(<StepDetails draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByText('Video Feed')).toBeInTheDocument()
    expect(screen.getByText('Itinerary Feed')).toBeInTheDocument()
    expect(screen.getByText('AI Slots')).toBeInTheDocument()
  })

  it('renders the objective selector', () => {
    render(<StepDetails draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Objective/i)).toBeInTheDocument()
  })

  it('renders start and end date fields', () => {
    render(<StepDetails draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Campaign start date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Campaign end date/i)).toBeInTheDocument()
  })

  it('calls patch when campaign name changes', () => {
    const patch = makePatch()
    render(<StepDetails draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Campaign name/i), { target: { value: 'My Trip Ad' } })
    expect(patch).toHaveBeenCalledWith('name', 'My Trip Ad')
  })

  it('shows an error and clears the field on past start date', () => {
    const patch = makePatch()
    render(<StepDetails draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), {
      target: { value: '2020-01-01' },
    })
    expect(screen.getByText(/Start date cannot be in the past/i)).toBeInTheDocument()
    expect(patch).toHaveBeenCalledWith('startDate', '')
  })

  it('accepts a valid future start date', () => {
    const patch = makePatch()
    render(<StepDetails draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Campaign start date/i), {
      target: { value: '2030-06-01' },
    })
    expect(screen.queryByText(/Start date cannot/i)).not.toBeInTheDocument()
    expect(patch).toHaveBeenCalledWith('startDate', '2030-06-01')
  })

  it('shows error and clears end date when end < start', () => {
    const patch = makePatch()
    const draft = { ...EMPTY_DRAFT, startDate: '2030-06-15' }
    render(<StepDetails draft={draft} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Campaign end date/i), {
      target: { value: '2030-06-01' },
    })
    expect(screen.getByText(/End date cannot be before start date/i)).toBeInTheDocument()
    expect(patch).toHaveBeenCalledWith('endDate', '')
  })

  it('accepts a valid end date after start date', () => {
    const patch = makePatch()
    const draft = { ...EMPTY_DRAFT, startDate: '2030-06-01' }
    render(<StepDetails draft={draft} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Campaign end date/i), {
      target: { value: '2030-08-01' },
    })
    expect(screen.queryByText(/End date cannot/i)).not.toBeInTheDocument()
    expect(patch).toHaveBeenCalledWith('endDate', '2030-08-01')
  })

  it('shows placement detail panel for current placement', () => {
    render(<StepDetails draft={{ ...EMPTY_DRAFT, placement: 'video_feed' }} patch={makePatch()} />)
    expect(screen.getByText(/Your ad plays inline in the full-screen vertical video feed/i)).toBeInTheDocument()
  })

  it('updates billing model to cpc when Traffic objective selected', () => {
    const patch = makePatch()
    render(<StepDetails draft={EMPTY_DRAFT} patch={patch} />)
    // Open the objective select and choose Traffic
    fireEvent.mouseDown(screen.getByLabelText(/Objective/i))
    fireEvent.click(screen.getByRole('option', { name: /Traffic/i }))
    expect(patch).toHaveBeenCalledWith('billingModel', 'cpc')
    expect(patch).toHaveBeenCalledWith('objective', 'Traffic')
  })
})
