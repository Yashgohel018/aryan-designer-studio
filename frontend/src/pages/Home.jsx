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

// ── Skeleton card shown while backend is waking up ───────────────────────────
function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img" />
      <div className="skeleton-body">
        <div className="skeleton-line short" />
        <div className="skeleton-line medium" />
        <div className="skeleton-line price" />
      </div>
    </div>
  )
}

function ProductCard({ p }) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Get list of all valid images
  const images = (() => {
    const list = []
    if (p.thumbnail) list.push(p.thumbnail)
    if (p.images && Array.isArray(p.images)) {
      p.images.forEach(img => {
        if (img && !list.includes(img)) {
          list.push(img)
        }
      })
    }
    return list
  })()

  useEffect(() => {
    if (!isHovered || images.length <= 1) {
      setCurrentImageIndex(0)
      return
    }

    const interval = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % images.length)
    }, 1000)

    return () => clearInterval(interval)
  }, [isHovered, images])

  const outOfStock = p.stock === 0 || p.soldOut
  const displayImage = images[currentImageIndex] || p.thumbnail || p.images?.[0]

  return (
    <Link
      to={`/product/${p.id}`}
      className="product-card"
      style={{ display: 'block' }}
      onMouseEnter={() => {
        if (window.matchMedia('(hover: hover)').matches) {
          setIsHovered(true)
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-card-img">
        {displayImage && <img loading="lazy" src={displayImage} alt={p.name} />}
        {outOfStock && <span className="sold-out-badge">Sold Out</span>}

        {/* Hover Dots Indicators */}
        {isHovered && images.length > 1 && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '5px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.45)',
            padding: '4px 8px',
            borderRadius: '10px',
            pointerEvents: 'none',
          }}>
            {images.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: '5px',
                  height: '5px',
                  borderRadius: '50%',
                  backgroundColor: idx === currentImageIndex ? '#fff' : 'rgba(255, 255, 255, 0.4)',
                  transition: 'background-color 0.2s ease',
                }}
              />
            ))}
          </div>
        )}
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
  const [isLoading, setIsLoading] = useState(true)
  const [slowLoad, setSlowLoad] = useState(false)  // shows "waking up" notice after 5s
  const navigate = useNavigate()


  // SEO: page title
  useEffect(() => {
    document.title = "Aryan Designer Studio — Premium Men's Fashion"
    return () => { document.title = 'Aryan Designer Studio' }
  }, [])

  useEffect(() => {
    // After 5s of loading, show a gentle "server waking up" notice
    const slowTimer = setTimeout(() => setSlowLoad(true), 5000)

    getProducts().then(all => {
      clearTimeout(slowTimer)
      // Show products marked as featured first; fall back to newest 6 if none are featured
      const featuredOnes = all.filter(p => p.featured)
      setFeatured(featuredOnes.length > 0 ? featuredOnes.slice(0, 6) : all.slice(0, 6))
      setIsLoading(false)
      setSlowLoad(false)
    })

    return () => clearTimeout(slowTimer)
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

          {/* Slow-load wakeup notice */}
          {isLoading && slowLoad && (
            <div className="wakeup-notice">
              <span className="wakeup-dot" />
              Server is waking up, products loading shortly…
            </div>
          )}

          {isLoading ? (
            /* Skeleton grid while backend wakes up */
            <div className="products-grid">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : featured.length === 0 ? (
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

