// @ts-nocheck
import React from 'react'
import { renderWithRouter, fireEvent } from '../testUtils/test-utils'
import Modal from '../components/common/Modal'

describe('Modal', () => {
  it('renders children when open and calls onClose on backdrop click and Escape', () => {
    const onClose = jest.fn()
    const { getByText, container } = renderWithRouter(
      <Modal open={true} title="Test" onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )

    expect(getByText('Modal content')).toBeTruthy()

    // backdrop click (Modal uses onMouseDown on backdrop)
    const backdrop = container.querySelector('.modal-backdrop')
    expect(backdrop).toBeTruthy()
    if (backdrop) fireEvent.mouseDown(backdrop)
    expect(onClose).toHaveBeenCalled()

    // open again to test Escape key
    onClose.mockClear()
    renderWithRouter(
      <Modal open={true} title="Test" onClose={onClose}>
        <div>Modal content</div>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
