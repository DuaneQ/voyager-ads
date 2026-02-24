import React from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import BlockIcon from '@mui/icons-material/Block'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CloseIcon from '@mui/icons-material/Close'
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'
import GavelIcon from '@mui/icons-material/Gavel'
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import MonetizationOnOutlinedIcon from '@mui/icons-material/MonetizationOnOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'

interface Props {
  open: boolean
  onClose: () => void
}

interface SectionProps {
  icon: React.ReactNode
  title: string
  color: string
  children: React.ReactNode
}

const Section: React.FC<SectionProps> = ({ icon, title, color, children }) => (
  <Box sx={{ mb: 3 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
      <Box sx={{ color }}>{icon}</Box>
      <Typography variant="subtitle1" fontWeight={700} sx={{ color }}>
        {title}
      </Typography>
    </Box>
    <Divider sx={{ mb: 1.5 }} />
    {children}
  </Box>
)

const BulletList: React.FC<{ items: string[]; color?: string }> = ({ items, color = 'text.secondary' }) => (
  <List dense disablePadding>
    {items.map((item) => (
      <ListItem key={item} disableGutters sx={{ py: 0.25, alignItems: 'flex-start' }}>
        <ListItemIcon sx={{ minWidth: 20, mt: 0.6 }}>
          <FiberManualRecordIcon sx={{ fontSize: 7, color }} />
        </ListItemIcon>
        <ListItemText
          primary={item}
          primaryTypographyProps={{ variant: 'body2', color: 'text.primary' }}
        />
      </ListItem>
    ))}
  </List>
)

const AdvertisingPolicyModal: React.FC<Props> = ({ open, onClose }) => (
  <Dialog
    open={open}
    onClose={onClose}
    maxWidth="md"
    fullWidth
    scroll="paper"
    aria-labelledby="advertising-policy-title"
  >
    <DialogTitle
      id="advertising-policy-title"
      sx={{ pr: 6, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}
    >
      <Box>
        <Typography variant="subtitle1" fontWeight={700} component="span" display="block">TravalPass Advertising Policy</Typography>
        <Typography variant="caption" color="text.secondary">
          Effective February 2026 · Applies to all advertisers on TravalPass
        </Typography>
      </Box>
      <IconButton
        aria-label="Close"
        onClick={onClose}
        size="small"
        sx={{ position: 'absolute', top: 12, right: 12 }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
    </DialogTitle>

    <DialogContent dividers sx={{ px: 3, py: 2.5 }}>

      {/* Introduction */}
      <Box
        sx={{
          bgcolor: 'primary.50',
          border: '1px solid',
          borderColor: 'primary.200',
          borderRadius: 2,
          p: 2,
          mb: 3,
          display: 'flex',
          gap: 1.5,
          alignItems: 'flex-start',
        }}
      >
        <InfoOutlinedIcon sx={{ color: 'primary.main', mt: 0.25, flexShrink: 0 }} />
        <Typography variant="body2" color="text.secondary">
          By submitting a campaign on TravalPass Ads, you agree to abide by this Advertising Policy in full.
          Violations may result in ad rejection, account suspension, or permanent removal from the platform.
          TravalPass reserves the right to update this policy at any time with 30 days' notice.
        </Typography>
      </Box>

      {/* Prohibited content */}
      <Section icon={<BlockIcon />} title="Prohibited Content" color="#d32f2f">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          The following content is strictly prohibited and will result in immediate ad removal:
        </Typography>
        <BulletList
          items={[
            'Illegal products or services, including unlicensed pharmaceuticals, weapons, or counterfeit goods.',
            'Content that discriminates against users based on race, ethnicity, nationality, gender, sexual orientation, age, religion, or disability.',
            'Misleading or deceptive claims — ads must accurately represent the product, service, price, and destination.',
            'Adult or sexually explicit content in any format.',
            'Violence, graphic imagery, or content that promotes harm to persons or animals.',
            'Malware, spyware, or ads that redirect users to phishing sites.',
            'Unauthorised use of third-party trademarks, logos, or intellectual property.',
          ]}
        />
      </Section>

      {/* Restricted content */}
      <Section icon={<WarningAmberIcon />} title="Restricted Content" color="#f57c00">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          The following categories require prior written approval and must meet additional standards:
        </Typography>
        <BulletList
          items={[
            'Alcohol — must comply with local laws in each targeted region and include age-gating where required.',
            'Financial services — must display required regulatory disclosures and not make unrealistic return guarantees.',
            'Health & supplements — must not make unapproved medical claims and must reference credible sources.',
            'Online gambling — permitted only in jurisdictions where legal, with responsible gambling messaging.',
            'Travel insurance — must clearly disclose policy limitations and exclusions.',
            'Subscription services — must clearly disclose recurring billing terms before checkout.',
          ]}
        />
      </Section>

      {/* Community & content standards */}
      <Section icon={<ShieldOutlinedIcon />} title="Community & Creative Standards" color="#1565c0">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          All ad creatives must meet the following standards:
        </Typography>
        <BulletList
          items={[
            'Images and videos must be high resolution, relevant to the advertised product, and not mislead through editing or obscured text.',
            'Primary text must be concise, grammatically correct, and avoid excessive use of emoji or capitalisation.',
            'CTAs must accurately reflect the destination action (e.g., "Book Now" must lead to a booking page).',
            'Landing pages must load within 3 seconds on mobile, use HTTPS, and not redirect users to unexpected pages.',
            'Ads targeting travel itineraries must be genuinely travel-related and relevant to the audience segment.',
            'Audio in video ads must be clear and not designed to startle or distress users.',
          ]}
        />
      </Section>

      {/* Targeting */}
      <Section icon={<CheckCircleOutlineIcon />} title="Targeting & Audience Rules" color="#2e7d32">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          TravalPass offers demographic, interest, and itinerary-based targeting. Advertisers must:
        </Typography>
        <BulletList
          items={[
            'Not use targeting to exclude users from offers based on protected characteristics (e.g., race, religion, gender).',
            'Not target users under 18 years of age with alcohol, gambling, or financial product ads.',
            'Ensure geo-targeting complies with regional advertising laws in each targeted market.',
            'Use destination matching and gender preference targeting only for legitimate travel-relevant reasons.',
            'Not attempt to reverse-engineer audience identities using combined targeting signals.',
          ]}
        />
      </Section>

      {/* Data & privacy */}
      <Section icon={<LockOutlinedIcon />} title="Data & Privacy" color="#6a1b9a">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          TravalPass Ads does not share individually identifiable user data with advertisers. Advertisers agree to:
        </Typography>
        <BulletList
          items={[
            'Not collect user data beyond what is necessary for campaign performance measurement.',
            'Comply with GDPR, CCPA, and any other applicable data protection laws for each targeted region.',
            'Not upload audience lists that contain sensitive personal data (health, financial, or biometric data).',
            'Provide a clear and accessible privacy policy on all landing pages.',
            'Not use pixel tracking or retargeting in a manner that violates user consent obtained through TravalPass.',
          ]}
        />
      </Section>

      {/* Payment & billing */}
      <Section icon={<MonetizationOnOutlinedIcon />} title="Payment & Billing" color="#00695c">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          All billing on TravalPass Ads operates on a pre-paid balance model:
        </Typography>
        <BulletList
          items={[
            'Campaigns spend against your pre-loaded account balance. You will not be charged beyond your available balance.',
            'Funds added to your account are non-refundable once a campaign has begun serving impressions.',
            'Unused balance may be carried forward indefinitely while your account remains active.',
            'TravalPass reserves the right to pause campaigns that exceed their allocated budget.',
            'All pricing is in USD and excludes applicable taxes. Tax invoices are issued monthly.',
            'TravalPass may adjust CPM/CPC floors at any time; rate changes take effect on new campaigns only.',
          ]}
        />
      </Section>

      {/* Enforcement */}
      <Section icon={<GavelIcon />} title="Enforcement & Appeals" color="#4e342e">
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          TravalPass reviews ads both automatically and manually. Enforcement actions include:
        </Typography>
        <BulletList
          items={[
            'Ad rejection — the ad will not serve; the advertiser is notified with a reason code.',
            'Campaign pause — the entire campaign is paused pending review.',
            'Account suspension — all campaigns are halted; access to Ads Manager is restricted.',
            'Account termination — for severe or repeated violations; pre-paid balance is forfeited.',
          ]}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          To appeal a decision, contact <Typography component="span" variant="body2" color="primary.main">support@travalpass.com</Typography> within
          14 days of the enforcement action, including your Campaign ID and a description of the appeal grounds.
          TravalPass will respond within 5 business days.
        </Typography>
      </Section>

      <Divider sx={{ my: 2 }} />

      <Typography variant="caption" color="text.disabled">
        This policy was last updated on <strong>February 2026</strong>. Questions? Contact us at{' '}
        <Typography component="span" variant="caption" color="primary.main">
          support@travalpass.com
        </Typography>
        . TravalPass Inc., 123 Travel Lane, San Francisco, CA 94105.
      </Typography>

    </DialogContent>

    <DialogActions sx={{ px: 3, py: 2 }}>
      <Button variant="contained" onClick={onClose}>
        I understand
      </Button>
    </DialogActions>
  </Dialog>
)

export default AdvertisingPolicyModal
