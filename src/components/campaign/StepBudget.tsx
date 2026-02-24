import React from 'react'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { type CampaignDraft, type BudgetType } from '../../types/campaign'

interface Props {
  draft: CampaignDraft
  patch: <K extends keyof CampaignDraft>(key: K, value: CampaignDraft[K]) => void
}

// Placeholder available balance — replace with real account balance from backend
const AVAILABLE_BALANCE = 100

const StepBudget: React.FC<Props> = ({ draft, patch }) => {
  const amount = parseFloat(draft.budgetAmount)
  const willExceed = !isNaN(amount) && amount > AVAILABLE_BALANCE

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
        error={willExceed}
        helperText={willExceed ? 'Exceeds available balance — add funds below' : undefined}
      />

      <TextField
        label="Billing model"
        value={draft.billingModel === 'cpm' ? 'CPM — Cost per 1,000 impressions' : 'CPC — Cost per click'}
        InputProps={{ readOnly: true }}
        helperText="Determined by your objective — change it in Step 1"
      />

      <Paper variant="outlined" sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">Available balance</Typography>
          <Typography variant="body1" fontWeight={600}>${AVAILABLE_BALANCE.toFixed(2)}</Typography>
        </Box>
        <Typography variant="caption" color="text.secondary">
          You will not be charged beyond your available balance. Add funds via Stripe Checkout (coming soon).
        </Typography>
      </Paper>
    </Box>
  )
}

export default StepBudget
