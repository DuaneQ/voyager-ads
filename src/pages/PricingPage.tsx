import React from 'react'
import { Helmet } from 'react-helmet-async'
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
      <Helmet>
        <title>Pricing — TravalPass Ads</title>
        <meta name="description" content="Transparent, performance-based pricing for TravalPass ad placements. CPM and CPC billing across all placements." />
        <link rel="canonical" href="https://travalpass-ads.web.app/pricing" />
      </Helmet>
      <Nav />
      <Container 
        maxWidth={false} 
        sx={{ 
          maxWidth: { xs: '100%', sm: 768, md: 960, lg: 1400, xl: 1600 },
          mx: 'auto',
          px: { xs: 0.8, sm: 0.8, md: 0.6, lg: 0.4, xl: 0.2 },
          py: 4 
        }}
      >
        <Typography variant="h1" gutterBottom sx={{ fontSize: { xs: '4.1rem', md: '4.8rem' }, lineHeight: 1.08 }}>
          Pricing
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, fontSize: { xs: '1.7rem', md: '1.85rem' }, lineHeight: 1.6 }}>
          Current prices per placement are shown below.
        </Typography>

        <Grid container spacing={2}>
          {PRICING_SIMPLE.map(p => (
            <Grid key={p.key} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card variant="outlined" sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h2" gutterBottom sx={{ fontSize: { xs: '2.55rem', md: '2.8rem' }, lineHeight: 1.2 }}>
                    {p.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.55 }}>
                    <strong>Model:</strong> {p.models.join(' or ')}
                  </Typography>
                  <List dense disablePadding>
                    {p.price && Object.entries(p.price).map(([model, value]) => (
                      <ListItem key={model} disableGutters>
                        <ListItemText
                          primaryTypographyProps={{ sx: { fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.55 } }}
                          primary={<><strong>{model}:</strong> ${value}{model === 'CPM' ? ' per 1,000 impressions' : ' per click'}</>}
                        />
                      </ListItem>
                    ))}
                  </List>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.6 }}>
                    {p.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box component="section" sx={{ mt: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ fontSize: { xs: '2.9rem', md: '3.2rem' }, lineHeight: 1.2 }}>
            Notes
          </Typography>
          <List dense>
            <ListItem disableGutters>
              <ListItemText
                primary="Prices above are billed per impression/click/view as shown."
                primaryTypographyProps={{ sx: { fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.6 } }}
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText
                primary="CPC campaigns include a $0.50 per 1,000 impression floor charge. This applies even when no clicks occur, ensuring delivery costs are tracked and budgets deplete at a minimum rate."
                primaryTypographyProps={{ sx: { fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.6 } }}
              />
            </ListItem>
            <ListItem disableGutters>
              <ListItemText
                primary="Video views and completions are tracked for analytics but not billed separately."
                primaryTypographyProps={{ sx: { fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.6 } }}
              />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '1.32rem', md: '1.45rem' }, lineHeight: 1.6 }}>
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
