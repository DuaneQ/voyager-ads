import { describe, it, expect } from 'vitest'
import { render, screen } from '../../testUtils/test-utils'
import HeadlineList from '../../components/landing/HeadlineList'

describe('HeadlineList', () => {
  it('renders each item as a list entry', () => {
    const items = ['Drive bookings', 'Grow revenue', 'Expand reach']
    render(<HeadlineList items={items} />)
    items.forEach((text) => {
      expect(screen.getByText(text)).toBeTruthy()
    })
  })

  it('appends the default suffix to each item', () => {
    render(<HeadlineList items={['Drive bookings']} />)
    expect(screen.getByText('with TravalPass Ads')).toBeTruthy()
  })

  it('appends a custom suffix when provided', () => {
    render(<HeadlineList items={['Drive bookings']} suffix="on TravalPass" />)
    expect(screen.getByText('on TravalPass')).toBeTruthy()
  })

  it('renders with the correct accessible label', () => {
    render(<HeadlineList items={['Drive bookings']} />)
    expect(screen.getByRole('region', { name: 'Key benefits for advertisers' })).toBeTruthy()
  })

  it('renders no list items when items array is empty', () => {
    render(<HeadlineList items={[]} />)
    expect(screen.queryAllByRole('listitem')).toHaveLength(0)
  })
})
