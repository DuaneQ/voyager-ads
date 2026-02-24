import React from 'react'
import Nav from '../components/common/Nav'

const SignInPage: React.FC = () => {
  return (
    <>
      <Nav />
      <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Sign in to TravalPass Ads</h1>
        <p style={{ color: '#64748b' }}>Advertiser sign-in coming soon.</p>
      </main>
    </>
  )
}

export default SignInPage
