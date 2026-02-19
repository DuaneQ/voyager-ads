import React from 'react'
import './nav.css'

const Nav: React.FC = () => {
  return (
    <nav className="site-nav">
      <div className="nav-inner">
        <div className="brand">TravalPass Ads</div>
        <div className="nav-links">
          <a href="#products">Products</a>
          <a href="#pricing">Pricing</a>
          <a href="#resources">Resources</a>
          <a className="btn-outline" href="#get-started">Get started</a>
        </div>
      </div>
    </nav>
  )
}

export default Nav
