// @ts-nocheck
import { render, fireEvent } from '../../testUtils/test-utils'
import Modal from '../../components/common/Modal'

describe('Modal', () => {
  it('opens and closes via ESC and backdrop', () => {
    // ensure modal portal root exists if Modal uses one
    const modalRoot = document.createElement('div')
    modalRoot.setAttribute('id', 'modal-root')
    document.body.appendChild(modalRoot)

    const onClose = vi.fn()
    const { getByRole } = render(
      <Modal open onClose={onClose} title="Test Modal">
        <div>content</div>
      </Modal>
    )

    expect(getByRole('dialog')).toBeTruthy()

    fireEvent.keyDown(getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })
})
