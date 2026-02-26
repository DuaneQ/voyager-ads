import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from './pages/Landing'
import ProtectedRoute from './components/common/ProtectedRoute'
import AdminRoute from './components/common/AdminRoute'
import useAuthStore from './store/authStore'
import { authService } from './services/auth/authServiceInstance'

const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SignInPage = lazy(() => import('./pages/SignInPage'))
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const CreateCampaignPage = lazy(() => import('./pages/CreateCampaignPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const CampaignDetailPage = lazy(() => import('./pages/CampaignDetailPage'))

function App() {
  const init = useAuthStore((s) => s.init)

  useEffect(() => {
    // Start the Firebase Auth listener once at app root.
    // Returns unsubscribe — cleans up the listener when the component unmounts.
    const unsubscribe = init(authService)
    return unsubscribe
  }, [init])

  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
        <Route
          path="/create-campaign"
          element={
            <ProtectedRoute>
              <CreateCampaignPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/campaigns/:id"
          element={
            <ProtectedRoute>
              <CampaignDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
