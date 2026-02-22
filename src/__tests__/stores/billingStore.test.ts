import { describe, it, expect, beforeEach } from 'vitest'
import useBillingStore from '../../store/billingStore'

const initialState = useBillingStore.getState()

beforeEach(() => {
  useBillingStore.setState(initialState, true)
})

describe('billingStore', () => {
  it('starts with null intent, idle status, and no error', () => {
    const { stripePaymentIntentId, status, errorMessage } = useBillingStore.getState()
    expect(stripePaymentIntentId).toBeNull()
    expect(status).toBe('idle')
    expect(errorMessage).toBeNull()
  })

  it('setPaymentIntent stores the intent ID', () => {
    useBillingStore.getState().setPaymentIntent('pi_abc123')
    expect(useBillingStore.getState().stripePaymentIntentId).toBe('pi_abc123')
  })

  it('setStatus updates billing status', () => {
    useBillingStore.getState().setStatus('pending')
    expect(useBillingStore.getState().status).toBe('pending')

    useBillingStore.getState().setStatus('succeeded')
    expect(useBillingStore.getState().status).toBe('succeeded')

    useBillingStore.getState().setStatus('failed')
    expect(useBillingStore.getState().status).toBe('failed')
  })

  it('setError stores an error message', () => {
    useBillingStore.getState().setError('Card declined')
    expect(useBillingStore.getState().errorMessage).toBe('Card declined')
  })

  it('setError can clear the error message', () => {
    useBillingStore.getState().setError('Something went wrong')
    useBillingStore.getState().setError(null)
    expect(useBillingStore.getState().errorMessage).toBeNull()
  })

  it('reset restores all fields to initial values', () => {
    useBillingStore.getState().setPaymentIntent('pi_xyz')
    useBillingStore.getState().setStatus('succeeded')
    useBillingStore.getState().setError('Oops')
    useBillingStore.getState().reset()

    const { stripePaymentIntentId, status, errorMessage } = useBillingStore.getState()
    expect(stripePaymentIntentId).toBeNull()
    expect(status).toBe('idle')
    expect(errorMessage).toBeNull()
  })
})
