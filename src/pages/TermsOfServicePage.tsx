import React from 'react'
import { Helmet } from 'react-helmet-async'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import Nav from '../components/common/Nav'

const EFFECTIVE_DATE = 'February 26, 2026'
const CONTACT_EMAIL = 'support@travalpass.com'

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Box component="section" sx={{ mb: 4 }}>
    <Typography variant="h2" gutterBottom sx={{ fontSize: '1.25rem', fontWeight: 700 }}>
      {title}
    </Typography>
    {children}
  </Box>
)

const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="body1" paragraph>
    {children}
  </Typography>
)

const TermsOfServicePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box component="main">
      <Helmet>
        <title>Terms of Service — TravalPass Ads</title>
        <meta
          name="description"
          content="TravalPass Ads Terms of Service — the rules and policies that govern use of the TravalPass advertising platform."
        />
        <link rel="canonical" href="https://travalpass-ads.web.app/terms" />
      </Helmet>
      <Nav />
      <Container maxWidth="md" sx={{ py: 6 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 3 }}
        >
          Back
        </Button>
        <Typography variant="h1" gutterBottom sx={{ fontSize: '2rem', fontWeight: 800 }}>
          Terms of Service
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Effective date: {EFFECTIVE_DATE}
        </Typography>
        <Divider sx={{ mb: 4 }} />

        <Section title="1. Introduction">
          <P>
            Welcome to TravalPass Ads ("we", "us", or "our"). These Terms of Service ("Terms") govern
            your access to and use of the TravalPass Ads platform, including all advertising tools,
            campaign management features, and related services (collectively, the "Service") made
            available at <Link component={RouterLink} to="/">travalpass-ads.web.app</Link>.
          </P>
          <P>
            By creating an account or submitting a campaign, you agree to be bound by these Terms and
            our Privacy Policy. If you do not agree, do not use the Service.
          </P>
        </Section>

        <Section title="2. Eligibility">
          <P>
            You must be at least 18 years old and have the legal authority to enter into a binding
            agreement on behalf of yourself or the business you represent. By using the Service you
            represent and warrant that you meet these requirements.
          </P>
          <P>
            We reserve the right to refuse access to any person or entity at our sole discretion,
            including if we believe you have previously violated these Terms.
          </P>
        </Section>

        <Section title="3. Account Registration">
          <P>
            You must register using a valid email address or a supported third-party authentication
            provider (e.g. Google). You are responsible for maintaining the confidentiality of your
            login credentials and for all activity that occurs under your account. Notify us immediately
            at <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link> if you suspect
            unauthorised access.
          </P>
          <P>
            You may not share accounts, create fake accounts, or use automation to create or manage
            accounts.
          </P>
        </Section>

        <Section title="4. Advertising Policies">
          <P>
            All ads submitted through TravalPass Ads must comply with our Advertising Policies, which
            are incorporated into these Terms by reference. We reserve the right to review, reject, or
            remove any campaign that we determine, in our sole discretion, violates our policies or
            applicable law.
          </P>
          <P>
            Ads must accurately represent the advertiser, product, or destination being promoted. You
            must not misrepresent pricing, availability, or material terms of any offer. Ads targeted
            at travel destinations must comply with the entry requirements and laws of those
            destinations.
          </P>
          <P>
            We do not allow ads that promote:
          </P>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {[
              'Illegal goods, services, or activities in any jurisdiction where the ad may be shown',
              'Discriminatory content based on race, ethnicity, religion, gender, sexual orientation, disability, or national origin',
              'Misleading or false claims about travel services, prices, or availability',
              'Adult content, gambling, firearms, or tobacco',
              'Phishing, malware, or deceptive download practices',
            ].map((item) => (
              <Typography component="li" variant="body1" key={item} sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
          <P>
            All submitted campaigns are subject to a review period before going live. Approval is not
            guaranteed.
          </P>
        </Section>

        <Section title="5. Payment Terms">
          <P>
            Campaigns are billed according to the pricing model for each placement (CPM for Itinerary
            Feed and AI Itinerary placements; CPV for Video Feed placements) as displayed on our{' '}
            <Link component={RouterLink} to="/pricing">Pricing page</Link>. Rates are subject to
            change; the rate in effect at the time your campaign is approved and activated will apply
            for that campaign.
          </P>
          <P>
            Payment is processed through our authorised payment processor (Stripe). By providing
            payment information you authorise us to charge the applicable fees. All fees are
            non-refundable except where required by law or where a campaign is rejected before
            delivery begins.
          </P>
          <P>
            You are responsible for all applicable taxes. We will collect taxes where required by law.
          </P>
        </Section>

        <Section title="6. Intellectual Property">
          <P>
            You retain ownership of the creative assets (images, copy, video) you upload to the
            Service. By submitting a campaign, you grant TravalPass a non-exclusive, worldwide,
            royalty-free licence to display, reproduce, and distribute your creative assets solely
            for the purposes of delivering your campaign.
          </P>
          <P>
            You represent and warrant that you own or have all necessary rights to the creative assets
            you submit, and that their use by us will not infringe any third-party intellectual
            property, privacy, or publicity rights.
          </P>
          <P>
            The TravalPass name, logo, and all platform software are our exclusive property. You may
            not use our branding without our prior written consent.
          </P>
        </Section>

        <Section title="7. Data and Privacy">
          <P>
            We collect and use data about your campaigns and account activity to operate and improve
            the Service. Campaign performance data (impressions, views, clicks) is made available to
            you in your dashboard.
          </P>
          <P>
            We do not sell your personal information to third parties. Data is processed in accordance
            with our Privacy Policy. By using the Service you consent to the collection and processing
            of data as described therein.
          </P>
          <P>
            Audience targeting on the TravalPass platform is based on anonymised cohort data derived
            from travel interests and itinerary activity. We do not enable targeting based on sensitive
            personal characteristics such as health, religion, or political opinion.
          </P>
        </Section>

        <Section title="8. No Guarantee of Performance">
          <P>
            We do not guarantee any specific number of impressions, views, clicks, conversions, or
            revenue outcomes from any campaign. Ad delivery is subject to available inventory, audience
            size, bid competition, and platform availability. We will endeavour to deliver your
            campaign as configured but are not liable for under-delivery due to circumstances outside
            our control.
          </P>
        </Section>

        <Section title="9. Prohibited Conduct">
          <P>You agree not to:</P>
          <Box component="ul" sx={{ pl: 3, mb: 2 }}>
            {[
              'Use the Service for any unlawful purpose or in violation of these Terms',
              'Attempt to gain unauthorised access to any part of the Service or its infrastructure',
              'Interfere with or disrupt the integrity or performance of the Service',
              'Reverse engineer, decompile, or disassemble any portion of the Service',
              'Use automated scripts to interact with the Service without our express written permission',
              'Engage in click fraud, impression fraud, or any other activity intended to generate invalid traffic',
            ].map((item) => (
              <Typography component="li" variant="body1" key={item} sx={{ mb: 0.5 }}>
                {item}
              </Typography>
            ))}
          </Box>
        </Section>

        <Section title="10. Indemnification">
          <P>
            You agree to indemnify, defend, and hold harmless TravalPass, its affiliates, officers,
            directors, employees, and agents from and against any claims, liabilities, damages, losses,
            and expenses (including reasonable legal fees) arising out of or related to: (a) your use
            of the Service; (b) your creative assets or campaign content; (c) your violation of these
            Terms; or (d) your violation of any third-party rights.
          </P>
        </Section>

        <Section title="11. Limitation of Liability">
          <P>
            To the maximum extent permitted by applicable law, TravalPass shall not be liable for any
            indirect, incidental, special, consequential, or punitive damages, including loss of
            profits, revenue, goodwill, or data, arising out of your use of or inability to use the
            Service, even if we have been advised of the possibility of such damages.
          </P>
          <P>
            Our total aggregate liability to you for any claim arising from or related to these Terms
            or the Service shall not exceed the total fees paid by you to us in the twelve (12) months
            preceding the claim.
          </P>
        </Section>

        <Section title="12. Termination">
          <P>
            You may close your account at any time by contacting us. We may suspend or terminate your
            access to the Service at any time, with or without notice, if we reasonably believe you
            have violated these Terms, engaged in fraudulent activity, or if continued access poses a
            risk to the platform or its users.
          </P>
          <P>
            Upon termination, any active campaigns will be paused and any outstanding balance for
            delivered impressions or views will become immediately due and payable.
          </P>
        </Section>

        <Section title="13. Governing Law">
          <P>
            These Terms are governed by and construed in accordance with the laws of the State of
            Delaware, United States, without regard to its conflict of law principles. Any dispute
            arising from these Terms shall be resolved exclusively in the state or federal courts
            located in Delaware, and you consent to personal jurisdiction in those courts.
          </P>
        </Section>

        <Section title="14. Changes to These Terms">
          <P>
            We may update these Terms from time to time. We will notify you of material changes by
            posting the updated Terms on this page and updating the effective date above. Your
            continued use of the Service after changes are posted constitutes your acceptance of the
            revised Terms.
          </P>
        </Section>

        <Section title="15. Contact">
          <P>
            Questions about these Terms? Contact us at{' '}
            <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>.
          </P>
        </Section>
      </Container>
    </Box>
  )
}

export default TermsOfServicePage
