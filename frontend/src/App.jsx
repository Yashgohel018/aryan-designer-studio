import React, { useEffect, useRef } from 'react'
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import About from './pages/About'
import Contact from './pages/Contact'
import Admin from './pages/Admin'
import NoInternet from './pages/NoInternet'

/* Scrolls to the top of the page on every route change */
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
}

/**
 * Probe the backend API with a real HTTP request to verify actual connectivity.
 * navigator.onLine is NOT reliable for DevTools "Offline" throttling —
 * only a real fetch() will be blocked by it.
 */
async function isConnected() {
  try {
    // Use a HEAD request against our own API — fast, no response body needed
    const res = await fetch('/api/products', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(3000),
    })
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

/* Intercepts route changes and redirects to /offline when truly offline */
function OfflineGuard() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/offline') return

    isConnected().then(online => {
      if (!online) {
        navigate('/offline', { replace: true })
      }
    })
  }, [location.pathname, navigate])

  return null
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  const isOffline = location.pathname === '/offline'

  if (isAdmin) {
    return <Admin />
  }

  if (isOffline) {
    return (
      <>
        <OfflineGuard />
        <NoInternet checkConnected={isConnected} />
      </>
    )
  }

  return (
    <div className="app-root">
      <ScrollToTop />
      <OfflineGuard />
      <Header />
      <main>
        {/* key forces remount on route change → re-triggers the CSS animation */}
        <div key={location.pathname} className="page-transition">
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/offline" element={<NoInternet checkConnected={isConnected} />} />
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}
