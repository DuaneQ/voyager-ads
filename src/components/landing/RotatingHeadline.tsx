import React, { useEffect, useState } from 'react'
import './rotatingHeadline.css'

type Props = {
  phrases: string[]
  suffix?: string
  interval?: number
  phraseColors?: string[]
}

const RotatingHeadline: React.FC<Props> = ({ phrases, suffix = 'with TravalPass Ads', interval = 2000, phraseColors }) => {
  const [index, setIndex] = useState(0)

  const defaultColors = ['#1a73e8', '#db4437', '#0f9d58', '#f4b400']
  const colorFor = (i: number) => {
    if (phraseColors && phraseColors[i]) return phraseColors[i]
    return defaultColors[i % defaultColors.length]
  }

  useEffect(() => {
    if (phrases.length <= 1) return
    const t = setInterval(() => setIndex((i) => (i + 1) % phrases.length), interval)
    return () => clearInterval(t)
  }, [phrases.length, interval])

  return (
    <div className="rotating-headline" aria-live="polite">
      <h1>
        <span className="phrase" style={{ color: colorFor(index) }}>{phrases[index]}</span>
        <span className="suffix"> {suffix}</span>
      </h1>
    </div>
  )
}

export default RotatingHeadline
