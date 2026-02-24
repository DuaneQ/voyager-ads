import React from 'react'
import { Helmet } from 'react-helmet-async'
import Nav from '../components/common/Nav'
import Products from '../components/landing/products/Products'

const ProductsPage: React.FC = () => {
  return (
    <main>
      <Helmet>
        <title>Ad Products — TravalPass Ads</title>
        <meta name="description" content="Explore TravalPass ad placements: Itinerary Feed cards, Video Feed inventory, and AI Itinerary native recommendations. Choose the format that fits your campaign goal." />
        <link rel="canonical" href="https://travalpass-ads.web.app/products" />
      </Helmet>
      <Nav />
      <Products />
    </main>
  )
}

export default ProductsPage
