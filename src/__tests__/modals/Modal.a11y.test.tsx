// @ts-nocheck
import React from 'react'
import { render } from '../../testUtils/test-utils'
import Modal from '../../components/common/Modal'

describe('Modal accessibility', () => {
  it('has role dialog and aria-modal when open', () => {
    const onClose = vi.fn()
    const { container } = render(
      <Modal open={true} title="Accessibility Test" onClose={onClose}>
        <div>Content</div>
      </Modal>
    )

    const dialog = container.querySelector('.modal[role="dialog"]')
    expect(dialog).toBeTruthy()
    expect(dialog?.getAttribute('aria-modal')).toBe('true')
  })
})
