import { describe, it, expect } from 'vitest'
import { campaignRepository } from '../../repositories/campaignRepositoryInstance'

describe('campaignRepository instance', () => {
  it('exports an object with create/getAll/update methods', () => {
    expect(campaignRepository).toBeDefined()
    expect(typeof (campaignRepository as any).create).toBe('function')
    expect(typeof (campaignRepository as any).getAllByUser).toBe('function')
    expect(typeof (campaignRepository as any).update).toBe('function')
  })
})
