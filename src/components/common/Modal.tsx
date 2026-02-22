import React from 'react'
import MuiDialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import IconButton from '@mui/material/IconButton'
import CloseIcon from '@mui/icons-material/Close'

type Props = {
  open: boolean
  title?: string
  onClose: () => void
  children?: React.ReactNode
}

const Modal: React.FC<Props> = ({ open, title, onClose, children }) => {
  return (
    <MuiDialog open={open} onClose={onClose} aria-labelledby="modal-title" maxWidth="sm" fullWidth>
      <DialogTitle id="modal-title" sx={{ pr: 6 }}>
        {title}
        <IconButton
          aria-label="Close"
          onClick={onClose}
          size="small"
          sx={{ position: 'absolute', top: 8, right: 8 }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
    </MuiDialog>
  )
}

export default Modal
