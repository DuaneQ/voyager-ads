import React from 'react'
import './headlineList.css'

type Props = {
  items: string[]
  suffix?: string
}

const HeadlineList: React.FC<Props> = ({ items, suffix = 'with TravalPass Ads' }) => {
  return (
    <section className="headline-list" aria-label="Key benefits for advertisers">
      <ul>
        {items.map((text, i) => (
          <li key={i}>
            <strong>{text}</strong>
            <span className="suffix"> {suffix}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default HeadlineList
