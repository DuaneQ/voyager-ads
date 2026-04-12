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
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          maxWidth: 1440,
          width: '100%',
          mx: 'auto',
          px: { xs: 2, sm: 3 },
          minHeight: { xs: 78, sm: 90 },
        }}
      >
        <MuiLink
          component={RouterLink}
          to="/"
          underline="none"
          sx={{ fontWeight: 800, fontSize: { xs: '1.35rem', sm: '1.55rem' }, color: 'text.primary' }}
        >
          TravalPass Ads
        </MuiLink>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.25, sm: 2 } }}>
          <MuiLink
            component={RouterLink}
            to="/products"
            underline="none"
            color="text.primary"
            sx={{ fontSize: { xs: '1rem', sm: '1.14rem' }, fontWeight: 500 }}
          >
            Products
          </MuiLink>
          <MuiLink
            component={RouterLink}
            to="/pricing"
            underline="none"
            color="text.primary"
            sx={{ fontSize: { xs: '1rem', sm: '1.14rem' }, fontWeight: 500 }}
          >
            Pricing
          </MuiLink>
          {isInitialized && isAuthenticated ? (
            <>
              <MuiLink
                component={RouterLink}
                to="/dashboard"
                underline="none"
                color="text.primary"
                sx={{ fontSize: { xs: '1rem', sm: '1.14rem' }, fontWeight: 500 }}
              >
                Dashboard
              </MuiLink>
              <Button
                variant="outlined"
                size="medium"
                onClick={handleSignOut}
                sx={{
                  px: { xs: 1.6, sm: 2.1 },
                  py: { xs: 0.75, sm: 0.95 },
                  borderRadius: 2,
                  fontSize: { xs: '0.98rem', sm: '1.1rem' },
                  fontWeight: 600,
                  lineHeight: 1.2,
                  minWidth: { xs: 96, sm: 116 },
                }}
              >
                Sign out
              </Button>
              <Button
                component={RouterLink}
                to="/create-campaign"
                variant="contained"
                size="medium"
                sx={{
                  px: { xs: 1.8, sm: 2.3 },
                  py: { xs: 0.78, sm: 0.98 },
                  borderRadius: 2,
                  fontSize: { xs: '0.98rem', sm: '1.12rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  minWidth: { xs: 132, sm: 168 },
                }}
              >
                New campaign
              </Button>
            </>
          ) : (
            <>
              <MuiLink
                component={RouterLink}
                to="/signin"
                underline="none"
                color="text.primary"
                sx={{ fontSize: { xs: '1rem', sm: '1.14rem' }, fontWeight: 500 }}
              >
                Sign in
              </MuiLink>
              <Button
                component={RouterLink}
                to="/create-campaign"
                variant="contained"
                size="medium"
                sx={{
                  px: { xs: 1.8, sm: 2.3 },
                  py: { xs: 0.78, sm: 0.98 },
                  borderRadius: 2,
                  fontSize: { xs: '0.98rem', sm: '1.12rem' },
                  fontWeight: 700,
                  lineHeight: 1.2,
                  minWidth: { xs: 132, sm: 168 },
                }}
              >
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
