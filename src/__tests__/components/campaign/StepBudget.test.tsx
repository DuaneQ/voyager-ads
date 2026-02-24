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

  it('shows available balance', () => {
    render(<StepBudget draft={EMPTY_DRAFT} patch={makePatch()} />)
    expect(screen.getByText('$100.00')).toBeInTheDocument()
  })

  it('shows exceeds-balance warning when amount is over 100', () => {
    render(<StepBudget draft={{ ...EMPTY_DRAFT, budgetAmount: '200' }} patch={makePatch()} />)
    expect(screen.getByText(/Exceeds available balance/i)).toBeInTheDocument()
  })

  it('does not show warning when amount is within balance', () => {
    render(<StepBudget draft={{ ...EMPTY_DRAFT, budgetAmount: '50' }} patch={makePatch()} />)
    expect(screen.queryByText(/Exceeds available balance/i)).not.toBeInTheDocument()
  })

  it('calls patch when budget amount changes', () => {
    const patch = makePatch()
    render(<StepBudget draft={EMPTY_DRAFT} patch={patch} />)
    fireEvent.change(screen.getByLabelText(/Budget amount/i), { target: { value: '25' } })
    expect(patch).toHaveBeenCalledWith('budgetAmount', '25')
  })
})
