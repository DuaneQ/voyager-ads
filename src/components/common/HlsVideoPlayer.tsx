/**
 * HlsVideoPlayer
 *
 * A lightweight video player that transparently handles HLS (.m3u8) streams:
 *  - Chrome / Firefox / Edge  → hls.js
 *  - Safari                   → native <video src> (built-in HLS support)
 *  - Plain MP4 / other URLs   → native <video src>
 *
 * Used wherever we need a standard playback UI (admin review card, edit preview)
 * as opposed to the muted auto-play phone-frame in CampaignAdPreview.
 */
import React, { useEffect, useRef } from 'react'
import Hls from 'hls.js'

interface Props {
  src: string
  controls?: boolean
  style?: React.CSSProperties
  'aria-label'?: string
}

const HlsVideoPlayer: React.FC<Props> = ({
  src,
  controls = true,
  style,
  'aria-label': ariaLabel,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return

    const isHls = src.endsWith('.m3u8') || src.includes('.m3u8?')

    if (isHls) {
      if (Hls.isSupported()) {
        const hls = new Hls()
        hls.loadSource(src)
        hls.attachMedia(video)
        return () => hls.destroy()
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari — native HLS support
        video.src = src
      }
    } else {
      video.src = src
    }
  }, [src])

  return (
    <video
      ref={videoRef}
      controls={controls}
      playsInline
      style={style}
      aria-label={ariaLabel}
    />
  )
}

export default HlsVideoPlayer
