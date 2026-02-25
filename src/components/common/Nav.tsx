import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import MuiLink from '@mui/material/Link'
import useAuthStore from '../../store/authStore'
import { authService } from '../../services/auth/authServiceInstance'

const Nav: React.FC = () => {
  const { isAuthenticated, isInitialized } = useAuthStore()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await authService.signOut()
    navigate('/', { replace: true })
  }

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
          {isInitialized && isAuthenticated ? (
            <>
              <MuiLink component={RouterLink} to="/dashboard" underline="none" color="text.primary">
                Dashboard
              </MuiLink>
              <Button variant="outlined" size="small" onClick={handleSignOut}>
                Sign out
              </Button>
              <Button component={RouterLink} to="/create-campaign" variant="contained" size="small">
                New campaign
              </Button>
            </>
          ) : (
            <>
              <MuiLink component={RouterLink} to="/signin" underline="none" color="text.primary">
                Sign in
              </MuiLink>
              <Button component={RouterLink} to="/create-campaign" variant="contained" size="small">
                Get started
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  )
}

export default Nav
