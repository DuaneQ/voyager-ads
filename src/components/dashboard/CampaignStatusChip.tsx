import React from 'react'
import Chip from '@mui/material/Chip'
import type { CampaignStatus } from '../../types/campaign'

interface Props {
  status: CampaignStatus
  isUnderReview: boolean
}

interface ChipConfig {
  label: string
  color: 'default' | 'warning' | 'success' | 'error' | 'info' | 'primary' | 'secondary'
}

function resolveConfig(status: CampaignStatus, isUnderReview: boolean): ChipConfig {
  if (isUnderReview) return { label: 'Under review', color: 'warning' }
  switch (status) {
    case 'active':    return { label: 'Active',    color: 'success' }
    case 'paused':    return { label: 'Paused',    color: 'default' }
    case 'completed': return { label: 'Completed', color: 'info'    }
    default:          return { label: 'Draft',     color: 'default' }
  }
}

const CampaignStatusChip: React.FC<Props> = ({ status, isUnderReview }) => {
  const { label, color } = resolveConfig(status, isUnderReview)
  return (
    <Chip
      label={label}
      color={color}
      size="small"
      variant={color === 'default' ? 'outlined' : 'filled'}
    />
  )
}

export default CampaignStatusChip
