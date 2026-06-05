import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import {
  GiShirt, GiArmoredPants, GiRunningShoe, GiWatch,
  GiBelt, GiClothes, GiSuitcase,
} from 'react-icons/gi'
import { MdOutlineCheckroom } from 'react-icons/md'
import { FaTrophy, FaTruck, FaWhatsapp, FaTags } from 'react-icons/fa'

const CATEGORIES = [
  { label: 'Shirts',                  icon: <GiShirt />,       cat: 'Shirts' },
  { label: 'Pants',                   icon: <GiArmoredPants />, cat: 'Pants' },
  { label: 'Formal Shirts & Pants',   icon: <GiSuitcase />,    cat: 'Formal Shirts & Pants Sets' },
  { label: 'Shirt & Pant',            icon: <GiClothes />,     cat: 'Shirt & Pant Sets' },
  { label: 'T-Shirt or Pant Sets',    icon: <MdOutlineCheckroom />, cat: 'T-Shirt or Pant Sets' },
  { label: 'Belts',                   icon: <GiBelt />,        cat: 'Belts' },
  { label: 'Shoes',                   icon: <GiRunningShoe />, cat: 'Branded Shoes' },
  { label: 'Watches',                 icon: <GiWatch />,       cat: 'Watches' },
  { label: 'Accessories',             icon: <FaTags />,        cat: 'Accessories' },
]

function ProductCard({ p }) {
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('ads_cart') || '[]'))

  useEffect(() => {
    function handleStorage() {
      setCart(JSON.parse(localStorage.getItem('ads_cart') || '[]'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function addToCart(e) {
    e.preventDefault()
    const outOfStock = p.stock === 0 || p.soldOut
    if (outOfStock) { alert('This item is sold out.'); return }
    const currentCart = JSON.parse(localStorage.getItem('ads_cart') || '[]')
    const found = currentCart.find(i => i.id === p.id && i.size === 'M')
    if (found) {
      if (p.stock !== undefined && p.stock !== null && found.quantity >= p.stock) {
        alert(`Cannot add more. Only ${p.stock} item(s) in stock.`);
        return
      }
      found.quantity += 1
    } else {
      currentCart.push({ id: p.id, name: p.name, price: p.price, quantity: 1, size: 'M', image: p.images?.[0], stock: p.stock ?? null })
    }
    localStorage.setItem('ads_cart', JSON.stringify(currentCart))
    window.dispatchEvent(new Event('storage'))
  }

  const outOfStock = p.stock === 0 || p.soldOut
  const cartItem = cart.find(i => i.id === p.id && i.size === 'M')
  const isMaxStock = cartItem && p.stock !== undefined && p.stock !== null && cartItem.quantity >= p.stock
  const btnDisabled = outOfStock || isMaxStock
  const btnText = outOfStock ? 'Sold Out' : isMaxStock ? 'Limit Reached' : '+ Add to Cart'

  return (
    <Link to={`/product/${p.id}`} className="product-card" style={{ display: 'block' }}>
      <div className="product-card-img">
        <img loading="lazy" src={p.images?.[0]} alt={p.name} />
        {outOfStock && <span className="sold-out-badge">Sold Out</span>}
        <div className="quick-add-overlay">
          <button
            className="quick-add-btn"
            onClick={addToCart}
            disabled={btnDisabled}
            style={isMaxStock ? { background: 'rgba(0,0,0,0.6)', cursor: 'not-allowed' } : {}}
          >
            {btnText}
          </button>
        </div>
      </div>
      <div className="product-card-body">
        {p.category && <div className="product-card-category">{p.category}</div>}
        <div className="product-card-name">{p.name}</div>
        <div className="product-card-price">₹{p.price?.toLocaleString('en-IN')}</div>
      </div>
    </Link>
  )
}

export default function Home() {
  const [featured, setFeatured] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    getProducts().then(all => setFeatured(all.slice(0, 6)))
  }, [])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-eyebrow">Men's Collection</div>
        <h1>Dress Sharp.<br /><em>Live Bold.</em></h1>
        <p className="hero-sub">
          Premium men's fashion Readymade and crafted with precision.<br />
          Elevate your style today.
        </p>
        <div className="hero-actions">
          <Link to="/products" className="btn btn-gold btn-lg">Shop Collection</Link>
          <Link to="/about#story" className="btn btn-outline btn-lg" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }}>Our Story</Link>
        </div>
        <div className="hero-scroll-hint">Scroll</div>
      </section>

      {/* ── Category Strip ───────────────────────────────── */}
      <section className="category-strip">
        <div className="container">
          <h2>Shop by Category</h2>
          <div className="category-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.cat}
                className="cat-card"
                onClick={() => navigate(`/products?cat=${encodeURIComponent(c.cat)}`)}
              >
                <span className="cat-icon">{c.icon}</span>
                <span className="cat-label">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ────────────────────────────── */}
      <section className="section" style={{ background: 'var(--off-white)' }}>
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-sub">Handpicked styles for the modern man</p>
            </div>
            <Link to="/products" className="btn btn-outline btn-sm">View All</Link>
          </div>
          {featured.length === 0 ? (
            <p className="text-muted text-center" style={{ padding: '3rem 0' }}>
              No products yet.
            </p>
          ) : (
            <div className="products-grid">
              {featured.map(p => <ProductCard key={p.id} p={p} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Brand Values ─────────────────────────────────── */}
      <section className="values-strip">
        <div className="container">
          <div className="values-grid">
            <div className="value-item">
              <div className="value-icon"><FaTrophy /></div>
              <div className="value-title">Premium Quality</div>
              <div className="value-desc">Every piece is crafted using the finest fabrics and skilled artisans.</div>
            </div>
            <div className="value-item">
              <div className="value-icon"><FaTruck /></div>
              <div className="value-title">Fast Delivery</div>
              <div className="value-desc">Quick and safe delivery right to your doorstep across India.</div>
            </div>
            <div className="value-item">
              <div className="value-icon"><FaWhatsapp /></div>
              <div className="value-title">Easy Ordering</div>
              <div className="value-desc">Place your order via WhatsApp in seconds. Hassle-free and personal.</div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
