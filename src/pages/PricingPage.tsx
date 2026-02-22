import React from 'react'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import MuiLink from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink } from 'react-router-dom'
import Nav from '../components/common/Nav'
import PRICING_SIMPLE from '../config/pricingConstants'

const PricingPage: React.FC = () => {
  return (
    <Box component="main">
      <Nav />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h1" gutterBottom>Pricing</Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Current prices per placement are shown below.
        </Typography>

        <Grid container spacing={2}>
          {PRICING_SIMPLE.map(p => (
            <Grid key={p.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h2" gutterBottom>{p.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Model:</strong> {p.models.join(' or ')}
                  </Typography>
                  <List dense disablePadding>
                    {p.price && Object.entries(p.price).map(([model, value]) => (
                      <ListItem key={model} disableGutters>
                        <ListItemText
                          primary={<><strong>{model}:</strong> ${value}{model === 'CPM' ? ' per 1,000 impressions' : model === 'CPV' ? ' per view' : ' per click'}</>}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {p.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box component="section" sx={{ mt: 4 }}>
          <Typography variant="h3" gutterBottom>Notes</Typography>
          <List dense>
            <ListItem disableGutters><ListItemText primary="Prices above are billed per impression/click/view as shown." /></ListItem>
            <ListItem disableGutters><ListItemText primary="Video views are counted at ~3s per view by default." /></ListItem>
            <ListItem disableGutters><ListItemText primary="CPA-based billing is not yet available." /></ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Want a custom package?{' '}
            <MuiLink component={RouterLink} to="/products">See our Products</MuiLink>
            {' '}or{' '}
            <MuiLink href="mailto:support@TravalPass.com">contact sales</MuiLink>.
          </Typography>
        </Box>
      </Container>
    </Box>
  )
}

export default PricingPage
