import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'

const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const CreateCampaignPage = lazy(() => import('./pages/CreateCampaignPage'))

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/create-campaign" element={<CreateCampaignPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
