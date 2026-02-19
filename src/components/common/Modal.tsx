import React, { useEffect, useRef } from 'react'
import './modal.css'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children?: React.ReactNode
}

const Modal: React.FC<Props> = ({ open, title, onClose, children }) => {
  const dialogRef = useRef<HTMLDivElement | null>(null)
  const lastActiveRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (open) {
      lastActiveRef.current = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKey)
      // move focus into dialog
      setTimeout(() => dialogRef.current?.focus(), 0)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // restore focus
      try {
        lastActiveRef.current?.focus()
      } catch (_) {}
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={dialogRef}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

export default Modal
