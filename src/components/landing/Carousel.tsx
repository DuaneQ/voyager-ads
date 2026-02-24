import React, { useEffect, useState } from 'react'

type Slide = {
  src: string
  alt: string
  description?: string
}

type Props = {
  images: Slide[]
  interval?: number
}

const Carousel: React.FC<Props> = ({ images, interval = 4000 }) => {
  const [index, setIndex] = useState(0)

  // Only computed if a PNG fails to load — not on every render
  const getFallbackSvg = (i: number) => {
    const svgs = [
      new URL('../../assets/ads/photo1.svg', import.meta.url).href,
      new URL('../../assets/ads/photo2.svg', import.meta.url).href,
      new URL('../../assets/ads/photo3.svg', import.meta.url).href,
      new URL('../../assets/ads/photo4.svg', import.meta.url).href,
    ]
    return svgs[i % svgs.length]
  }

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % images.length), interval)
    return () => clearInterval(t)
  }, [images.length, interval])

  if (images.length === 0) return null

  return (
    <div className="carousel" aria-roledescription="carousel">
      <div className="carousel-track" role="group" aria-label="Ad samples">
        {images.map((item, i) => (
          <div
            key={item.src}
            className={`carousel-slide ${i === index ? 'active' : ''}`}
            aria-hidden={i !== index}
            aria-label={`Slide ${i + 1} of ${images.length}`}
          >
            <picture>
              <source
                srcSet={item.src.replace(/\.png$/, '.webp')}
                type="image/webp"
              />
              <img
                src={item.src}
                alt={item.alt}
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchPriority={i === 0 ? 'high' : 'low'}
                onError={(e) => {
                  const el = e.currentTarget as HTMLImageElement
                  const fallback = getFallbackSvg(i)
                  if (el.src !== fallback) el.src = fallback
                  // eslint-disable-next-line no-console
                  console.warn(`Carousel: failed to load ${item.src}, using fallback ${fallback}`)
                }}
              />
            </picture>
          </div>
        ))}
      </div>
      <div aria-live="polite" className="sr-only">
        {`Showing slide ${index + 1} of ${images.length}. ${
          images[index]?.description ?? ''
        }`}
      </div>
    </div>
  )
}

export default Carousel
