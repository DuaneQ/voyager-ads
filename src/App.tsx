import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import ProductsPage from './pages/ProductsPage'
import PricingPage from './pages/PricingPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/pricing" element={<PricingPage />} />
    </Routes>
  )
}

export default App
