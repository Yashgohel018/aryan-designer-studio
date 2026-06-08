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
import { pingBackend } from './lib/productStore'

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
 *
 * Timeout raised to 60s: Render free-tier cold starts can take 30–60 s.
 * We don't want to wrongly redirect to /offline during a normal wakeup.
 */
async function isConnected() {
  try {
    // Use a HEAD request against our own API — fast, no response body needed
    const res = await fetch('/api/products', {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(60_000), // ← was 3 000 ms, now 60 s
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

// ── Keep-alive: ping the backend every 14 min while any tab is open ──────────
// Render free tier sleeps after ~15 min of inactivity. This keeps it warm
// as long as someone has the site open — no external service needed.
const PING_INTERVAL_MS = 14 * 60 * 1000 // 14 minutes

function useKeepAlive() {
  useEffect(() => {
    // Ping immediately on first load to start waking a cold server ASAP
    pingBackend()

    let intervalId = null

    function startPinging() {
      if (intervalId) return
      intervalId = setInterval(pingBackend, PING_INTERVAL_MS)
    }

    function stopPinging() {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }

    // Respect page visibility — no need to ping when tab is hidden
    function handleVisibility() {
      if (document.visibilityState === 'visible') {
        pingBackend() // ping immediately on tab focus (could have been away for a while)
        startPinging()
      } else {
        stopPinging()
      }
    }

    startPinging()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      stopPinging()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])
}

export default function App() {
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'
  const isOffline = location.pathname === '/offline'

  // Keep the Render backend warm while anyone has the site open
  useKeepAlive()

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
