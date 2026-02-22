// @ts-nocheck
import { render, screen } from '../../testUtils/test-utils'
import Modal from '../../components/common/Modal'

describe('Modal accessibility', () => {
  it('has role dialog and aria-modal when open', () => {
    const onClose = vi.fn()
    render(
      <Modal open={true} title="Accessibility Test" onClose={onClose}>
        <div>Content</div>
      </Modal>
    )

    // MUI Dialog renders into a portal — use screen, not container
    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(dialog.getAttribute('aria-modal')).toBe('true')
  })
})
