import React, { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import About from './pages/About'
import Contact from './pages/Contact'
import Admin from './pages/Admin'

/* Scrolls to the top of the page on every route change */
function ScrollToTop() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname, search])
  return null
}

export default function App(){
  const location = useLocation()
  const isAdmin = location.pathname === '/admin'

  if (isAdmin) {
    return <Admin />
  }

  return (
    <div className="app-root">
      <ScrollToTop />
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
          </Routes>
        </div>
      </main>
      <Footer />
    </div>
  )
}
