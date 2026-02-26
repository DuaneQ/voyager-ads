import React, { useCallback, useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Pagination from '@mui/material/Pagination'
import Typography from '@mui/material/Typography'

const PAGE_SIZE = 10
import Nav from '../components/common/Nav'
import CampaignReviewCard from '../components/admin/CampaignReviewCard'
import { adminService } from '../services/admin/adminServiceInstance'
import type { Campaign } from '../types/campaign'

const AdminPage: React.FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const pending = await adminService.getPendingCampaigns()
      setCampaigns(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id: string) => {
    await adminService.reviewCampaign(id, 'approve')
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== id)
      // If we just emptied the current page, step back one
      const maxPage = Math.max(1, Math.ceil(next.length / PAGE_SIZE))
      setPage((p) => Math.min(p, maxPage))
      return next
    })
  }

  const handleReject = async (id: string, note: string) => {
    await adminService.reviewCampaign(id, 'reject', note)
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== id)
      const maxPage = Math.max(1, Math.ceil(next.length / PAGE_SIZE))
      setPage((p) => Math.min(p, maxPage))
      return next
    })
  }

  const pageCount = Math.max(1, Math.ceil(campaigns.length / PAGE_SIZE))
  const visibleCampaigns = campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return (
    <Box component="main">
      <Helmet>
        <title>Admin — Campaign Review</title>
      </Helmet>
      <Nav />
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography variant="h1" gutterBottom sx={{ fontSize: '1.75rem', fontWeight: 800 }}>
          Campaign Review
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Campaigns awaiting approval before going live.
        </Typography>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && error && <Alert severity="error">{error}</Alert>}

        {!loading && !error && campaigns.length === 0 && (
          <Alert severity="success">No campaigns pending review.</Alert>
        )}

        {!loading && campaigns.length > 0 && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''} pending
            {pageCount > 1 && ` — page ${page} of ${pageCount}`}
          </Typography>
        )}

        {!loading && visibleCampaigns.map((c) => (
          <CampaignReviewCard
            key={c.id}
            campaign={c}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        ))}

        {!loading && pageCount > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_e, v) => { setPage(v); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              color="primary"
            />
          </Box>
        )}
      </Container>
    </Box>
  )
}

export default AdminPage
