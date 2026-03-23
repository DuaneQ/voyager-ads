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
  // Only load slides that have been shown or are next — reduces initial image payload from all 5 to 2
  const [revealed, setRevealed] = useState<Set<number>>(
    () => images.length === 0 ? new Set() : new Set([0, Math.min(1, images.length - 1)])
  )

  useEffect(() => {
    if (images.length <= 1) return
    const t = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % images.length
        const preload = (next + 1) % images.length
        setRevealed((r) => {
          if (r.has(next) && r.has(preload)) return r
          const s = new Set(r)
          s.add(next)
          s.add(preload)
          return s
        })
        return next
      })
    }, interval)
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
            {revealed.has(i) && (
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
                  width={560}
                  height={315}
                />
              </picture>
            )}
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
