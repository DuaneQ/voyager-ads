import React, { useState } from 'react'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import Modal from '../common/Modal'

const LandingQuestions: React.FC = () => {
  const [open, setOpen] = useState<null | 'how' | 'connect'>(null)

  return (
    <>
      <Box
        component="section"
        aria-label="learn more"
        sx={{
          maxWidth: 1400,
          mx: 'auto',
          px: { xs: 1, md: 2 },
          py: 3,
        }}
      >
        <Typography
          variant="h3"
          align="center"
          gutterBottom
          sx={{ fontSize: { xs: '2.4rem', md: '3.1rem' }, lineHeight: 1.1 }}
        >
          Questions?
        </Typography>
        <List disablePadding>
          <ListItemButton divider onClick={() => setOpen('how')} sx={{ py: 1.25 }}>
            <ListItemText
              primary="How do TravalPass Ads work?"
              primaryTypographyProps={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, lineHeight: 1.35 }}
            />
            <ChevronRightIcon color="action" />
          </ListItemButton>
          <ListItemButton onClick={() => setOpen('connect')} sx={{ py: 1.25 }}>
            <ListItemText
              primary="How can TravalPass Ads help my business?"
              primaryTypographyProps={{ fontSize: { xs: '1.2rem', md: '1.5rem' }, lineHeight: 1.35 }}
            />
            <ChevronRightIcon color="action" />
          </ListItemButton>
        </List>
      </Box>

      <Modal open={open === 'how'} title="How do TravalPass Ads work?" onClose={() => setOpen(null)}>
        <p>
          Great question! TravalPass Ads place your promotions directly inside travelers' planning experiences on our platform. We match creative to the traveler's intent and trip context so your message reaches people at the decision moment — helping increase bookings, inquiries, store visits, or broader brand awareness.
        </p>
      </Modal>

      <Modal open={open === 'connect'} title="How can TravalPass Ads help my business?" onClose={() => setOpen(null)}>
        <p>
          TravalPass Ads help you reach travelers actively planning trips who are likely to be interested in your offerings. By targeting relevant trip moments and measuring outcomes, you can drive reservations, leads, or in-person visits that grow your business.
        </p>
      </Modal>
    </>
  )
}

export default LandingQuestions
