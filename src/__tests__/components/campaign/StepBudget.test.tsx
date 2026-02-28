import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { render } from '../../../testUtils/test-utils'
import StepBudget from '../../../components/campaign/StepBudget'
import { EMPTY_DRAFT } from '../../../types/campaign'

const makePatch = () => vi.fn()

describe('StepBudget', () => {
  it('renders the budget type selector', () => {
    render(<StepBudget draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Budget type/i)).toBeInTheDocument()
  })

  it('renders the budget amount field', () => {
    render(<StepBudget draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByLabelText(/Budget amount/i)).toBeInTheDocument()
  })

  it('renders the billing model as read-only', () => {
    render(<StepBudget draft={{ ...EMPTY_DRAFT, billingModel: 'cpm' }} patch={makePatch()} />)
    expect(screen.getByDisplayValue('CPM — Cost per 1,000 impressions')).toBeInTheDocument()
  })

  it('shows CPC label when billingModel is cpc', () => {
    render(<StepBudget draft={{ ...EMPTY_DRAFT, billingModel: 'cpc' }} patch={makePatch()} />)
    expect(screen.getByDisplayValue('CPC — Cost per click')).toBeInTheDocument()
  })

  it('calls patch when budget amount changes', () => {
    const patch = makePatch()
    render(<StepBudget draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Budget amount/i), { target: { value: '25' } })
    expect(patch).toHaveBeenCalledWith('budgetAmount', '25')
  })

  it('calls patch when budget type changes', async () => {
    const patch = makePatch()
    render(<StepBudget draft={EMPTY_DRAFT} patch={patch} />)
    // MUI Select: open the dropdown then click the target option
    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Budget type/i }))
    fireEvent.click(await screen.findByRole('option', { name: /Lifetime/i }))
    expect(patch).toHaveBeenCalledWith('budgetType', 'lifetime')
  })
})
