import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Link as RouterLink } from 'react-router-dom'
import MuiLink from '@mui/material/Link'

const Nav: React.FC = () => {
  return (
    <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1280, width: '100%', mx: 'auto', px: { xs: 2, sm: 3 } }}>
        <MuiLink component={RouterLink} to="/" underline="none" sx={{ fontWeight: 700, fontSize: '1.1rem', color: 'text.primary' }}>
          TravalPass Ads
        </MuiLink>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <MuiLink component={RouterLink} to="/products" underline="none" color="text.primary">
            Products
          </MuiLink>
          <MuiLink component={RouterLink} to="/pricing" underline="none" color="text.primary">
            Pricing
          </MuiLink>
          <Button component={RouterLink} to="/pricing#get-started" variant="outlined" size="small">
            Get started
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Nav
