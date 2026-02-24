import React from 'react'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import { type CampaignDraft, type BudgetType } from '../../types/campaign'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

const StepBudget: React.FC<Props> = ({ draft, patch }) => {

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <TextField
        select
        label="Budget type"
        value={draft.budgetType}
        onChange={e => patch('budgetType', e.target.value as BudgetType)}
      >
        <MenuItem value="daily">Daily</MenuItem>
        <MenuItem value="lifetime">Lifetime</MenuItem>
      </TextField>

      <TextField
        label="Budget amount (USD)"
        type="number"
        required
        inputProps={{ min: 1 }}
        value={draft.budgetAmount}
        onChange={e => patch('budgetAmount', e.target.value)}
      />

      <TextField
        label="Billing model"
        value={draft.billingModel === 'cpm' ? 'CPM — Cost per 1,000 impressions' : 'CPC — Cost per click'}
        InputProps={{ readOnly: true }}
        helperText="Determined by your objective — change it in Step 1"
      />

    </Box>
  )
}

export default StepBudget
