import React, { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FaShoppingBag } from 'react-icons/fa'

export default function Header() {
  const [cartCount, setCartCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const updateCart = () => {
    const items = JSON.parse(localStorage.getItem('ads_cart') || '[]')
    setCartCount(items.reduce((s, i) => s + i.quantity, 0))
  }

  useEffect(() => {
    updateCart()
    window.addEventListener('storage', updateCart)
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => {
      window.removeEventListener('storage', updateCart)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/products', label: 'Shop' },
    { to: '/about', label: 'About' },
    { to: '/contact', label: 'Contact' },
  ]

  return (
    <>
      <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
        <div className="header-inner">
          {/* Left: navigation */}
          <div className="header-left">
            <button
              className={`hamburger${menuOpen ? ' open' : ''}`}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
            <nav className="nav">
              {navLinks.map(l => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.to === '/'}
                  className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Center: brand logo */}
          <div className="header-center">
            <Link to="/" className="brand-logo-link">
              <img
                src="/logo.png"
                alt="Aryan Designer Studio"
                className="brand-logo"
              />
            </Link>
          </div>

          {/* Right: cart */}
          <div className="header-right">
            <Link to="/cart" className="cart-btn">
              <FaShoppingBag /> Cart
              {cartCount > 0 && <span className="cart-badge" key={cartCount}>{cartCount}</span>}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Nav Drawer */}
      <nav className={`mobile-nav${menuOpen ? ' open' : ''}`}>
        {navLinks.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === '/'}
            className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
            onClick={() => setMenuOpen(false)}
          >
            {l.label}
          </NavLink>
        ))}
        <Link to="/cart" className="nav-link" onClick={() => setMenuOpen(false)}>
          Cart {cartCount > 0 && `(${cartCount})`}
        </Link>
      </nav>
    </>
  )
}
