import React, { useState } from 'react'
import '../App.css'
import Nav from '../components/common/Nav'
import Hero from '../components/landing/Hero'
import Modal from '../components/common/Modal'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'

const Landing: React.FC = () => {
  const [open, setOpen] = useState<null | 'how' | 'connect'>(null)
  const [faqOpen, setFaqOpen] = useState<number | null>(null)

  return (
    <main id="landing-root">
      <Nav />
      <Hero />

      <section className="features" aria-label="features">
        <h2 className="features-title">Achieve all your goals in one place</h2>
        <div className="features-grid">
          <div className="feature">
            <div className="feature-icon icon-leads" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="8" y="2" width="8" height="4" rx="1"></rect>
                <rect x="3" y="8" width="18" height="13" rx="2"></rect>
              </svg>
            </div>
            <h3>Maximize bookings and high-quality leads</h3>
            <p>Reach travelers who are actively planning trips and convert interest into confirmed bookings or valuable inquiries with TravalPass placements.</p>
          </div>

          <div className="feature">
            <div className="feature-icon icon-sales" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="11" width="4" height="8" rx="1"></rect>
                <rect x="10" y="7" width="4" height="12" rx="1"></rect>
                <rect x="17" y="3" width="4" height="16" rx="1"></rect>
              </svg>
            </div>
            <h3>Increase online bookings and revenue</h3>
            <p>Show up where trip planners shop and book, driving more site visits and higher conversion for your offers.</p>
          </div>

          <div className="feature">
            <div className="feature-icon icon-store" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 7h18"></path>
                <path d="M5 7v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7"></path>
                <path d="M7 7V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v3"></path>
              </svg>
            </div>
            <h3>Drive local visits and in-person bookings</h3>
            <p>Bring travelers to your storefronts or venues with location-aware promotions and offers they can redeem during their trip.</p>
          </div>

          <div className="feature">
            <div className="feature-icon icon-brand" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="9"></circle>
                <path d="M2 12h20"></path>
                <path d="M12 2a15 15 0 0 1 0 20"></path>
              </svg>
            </div>
            <h3>Expand your brand among travelers</h3>
            <p>Boost awareness by placing your brand across key trip moments, increasing reach and audience engagement.</p>
          </div>

          <div className="feature">
            <div className="feature-icon icon-app" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="7" y="2" width="10" height="20" rx="2"></rect>
                <path d="M11 18h2"></path>
              </svg>
            </div>
            <h3>Grow app installs and long-term engagement</h3>
            <p>Promote your app to the right travelers at the right time to increase downloads and active users.</p>
          </div>
        </div>
      </section>

      <section className="travalpass-power" aria-label="travalpass power">
        <h2 className="tp-title">The power of TravalPass Ads, for your business</h2>
        <div className="tp-grid">
          <div className="tp-item">
            <div className="tp-card tp-top-visual">
              <img src="/assets/ads/reach_travelers.png" alt="Illustration: reach travelers" />
            </div>
            <h3>Reach travelers where they plan</h3>
            <p>Show your offers across TravalPass surfaces — itineraries, discovery feeds, and planning tools — so your message appears when travelers are making decisions.</p>
          </div>

          <div className="tp-item">
            <div className="tp-card tp-top-visual">
              <img src="/assets/ads/measure.png" alt="Illustration: measure and optimize" />
            </div>
            <h3>Measure and optimize for real outcomes</h3>
            <p>Track conversions and audience signals inside TravalPass. Automated optimization focuses budget on placements and creatives that drive the most value for your objectives.</p>
          </div>

          <div className="tp-item">
            <div className="tp-card tp-top-visual">
              <img src="/assets/ads/budget.png" alt="Illustration: budget control" />
            </div>
            <h3>Keep full control of budget and performance</h3>
            <p>Set budgets, get practical recommendations, and adjust campaigns anytime — with transparent reporting so you can manage ROI confidently.</p>
          </div>
        </div>
      </section>

      <Box component="section" aria-label="learn more" sx={{ maxWidth: 720, mx: 'auto', px: 2, py: 3 }}>
        <Typography variant="h3" align="center" gutterBottom>Questions?</Typography>
        <List disablePadding>
          <ListItemButton divider onClick={() => setOpen('how')}>
            <ListItemText primary="How do TravalPass Ads work?" />
            <ChevronRightIcon color="action" />
          </ListItemButton>
          <ListItemButton onClick={() => setOpen('connect')}>
            <ListItemText primary="How can TravalPass Ads help my business?" />
            <ChevronRightIcon color="action" />
          </ListItemButton>
        </List>
      </Box>

      <Modal open={open === 'how'} title="How do TravalPass Ads work?" onClose={() => setOpen(null)}>
        <p>
          Great question! TravalPass Ads place your promotions directly inside travelers' planning experiences on our platform. We match creative to the traveler’s intent and trip context so your message reaches people at the decision moment — helping increase bookings, inquiries, store visits, or broader brand awareness.
        </p>
      </Modal>

      <Modal open={open === 'connect'} title="How can TravalPass Ads help my business?" onClose={() => setOpen(null)}>
        <p>
          TravalPass Ads help you reach travelers actively planning trips who are likely to be interested in your offerings. By targeting relevant trip moments and measuring outcomes, you can drive reservations, leads, or in-person visits that grow your business.
        </p>
      </Modal>

      <section className="faq-section" aria-label="frequently asked questions">
        <h2>Frequently asked questions</h2>
        <div className="faq-list">
          {[
            {
              q: 'What are the different types of TravalPass Ads campaigns I can run?',
              a: [
                'TravalMatch (swipe) placements — promoted itinerary cards that appear in the swipe feed; these promotions can target by demographics, trip location and dates.',
                "Video feed campaigns — video ads shown in the app's video feed.",
                'AI Itinerary promotions — ads shown inside the AI Itineraries/promotion section.'
              ]
            },
            {
              q: 'How can I use TravalPass Ads to reach potential customers?',
              a: "TravalPass helps you reach travelers who are actively planning trips or researching leisure experiences. You can target by destination and travel dates (verified in the app for itinerary promotions), and by trip intent or interests — for example beach getaways, family travel, or adventure seekers. Build custom audiences from relevant destinations, keywords, or users who have engaged with similar itineraries so your ads show to people most likely to convert."
            }
          ].map((item, i) => (
            <div key={i} className={`faq-item ${faqOpen === i ? 'open' : ''}`}>
              <button
                className="faq-question"
                aria-expanded={faqOpen === i}
                onClick={() => setFaqOpen(faqOpen === i ? null : i)}
              >
                <span>{item.q}</span>
                <span className="faq-toggle">{faqOpen === i ? '−' : '+'}</span>
              </button>
              <div className="faq-answer" hidden={faqOpen !== i}>
                {Array.isArray(item.a) ? (
                  <ul className="faq-bullets">
                    {item.a.map((line: string, idx: number) => (
                      <li key={idx}>{line}</li>
                    ))}
                  </ul>
                ) : (
                  <p>{item.a}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>© {new Date().getFullYear()} Voyager Ads</p>
      </footer>
    </main>
  )
}

export default Landing
