import React from 'react'
import Carousel from './Carousel'
import './hero.css'
import './carousel.css'
import RotatingHeadline from './RotatingHeadline'

// Use runtime-resolved URLs for assets (avoids static import resolution issues)

type Props = {
  subtitle?: string
}

const Hero: React.FC<Props> = ({
  subtitle = 'Flexible, privacy-first advertising to connect with high-intent travelers.'
}) => {
  return (
    <section className="hero-landing">
      <div className="hero-grid">
        <div className="hero-copy">
          <RotatingHeadline
            phrases={[
              'Advertise to travelers who are actively planning their trips',
              'Reach high-intent travelers at the moment they decide',
              "Put your brand directly inside travelers' itineraries",
              'The first AI-powered travel platform built for smart advertising',
            ]}
            suffix="with TravalPass Ads"
            interval={2000}
          />
          <p className="hero-lead">{subtitle}</p>
          <div className="hero-actions">
            <a className="btn-primary" href="#get-started">Get started</a>
            <a className="btn-ghost" href="#learn-more">Learn more</a>
          </div>
        </div>
        <div className="hero-art">
          <Carousel
            images={[
              {
                src: '/assets/ads/photo1.png',
                alt: 'Travel shopping ad example featuring a carry-on suitcase product',
                description: 'Example: stylish carry-on luggage product card.'
              },
              {
                src: '/assets/ads/photo2.png',
                alt: 'Oceanfront villa ad example with pool and private villa',
                description: 'Example: oceanfront villa stay promotion.'
              },
              {
                src: '/assets/ads/photo3.png',
                alt: 'Flight deals ad example with airplane wing at sunset',
                description: 'Example: discounted round-trip flights.'
              },
              {
                src: '/assets/ads/photo4.png',
                alt: 'Resorts and excursions ad example with resort pool',
                description: 'Example: excursions and resort promotions.'
              },
              {
                src: '/assets/ads/photo5.png',
                alt: 'Additional ad sample',
                description: 'Additional ad sample.'
              }
            ]}
          />
        </div>
      </div>
      <p style={{ textAlign: 'center', marginTop: '1rem', color: 'rgba(33,53,71,0.8)' }}>
        Whatever your business goal — bookings, experiences, or hotel stays — drive better results with TravalPass Ads.
      </p>
    </section>
  )
}

export default Hero
