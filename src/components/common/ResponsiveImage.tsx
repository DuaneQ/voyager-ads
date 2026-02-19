import React from 'react'

type Source = {
  srcSet: string
  type?: string
  media?: string
}

type Props = React.ImgHTMLAttributes<HTMLImageElement> & {
  sources?: Source[]
  fallbackSrc: string
}

const ResponsiveImage: React.FC<Props> = ({ sources = [], fallbackSrc, alt = '', ...imgProps }) => {
  return (
    <picture>
      {sources.map((s, i) => (
        <source key={i} srcSet={s.srcSet} type={s.type} media={s.media} />
      ))}
      <img src={fallbackSrc} alt={alt} {...imgProps} />
    </picture>
  )
}

export default ResponsiveImage
