import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import { FaSearch, FaStar, FaFire } from 'react-icons/fa'

const CATEGORIES = [
  'All', 'Shirts', 'Pants', 'Formal Shirts & Pants Sets',
  'Shirt & Pant Sets', 'T-Shirt or Pant Sets',
  'Belts', 'Branded Shoes', 'Watches', 'Accessories',
]

const PAGE_SIZE = 30

// ── Skeleton card shown while backend wakes up ───────────────────────────────
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

function ProductListCard({ p }) {
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
  const effectivePrice = p.discountPrice || p.price
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
        {outOfStock && <span className="sold-out-badge">Out of Stock</span>}
        {!outOfStock && p.newArrival && <span className="new-badge">New</span>}
        {!outOfStock && p.bestSeller && <span className="bestseller-badge"><FaFire style={{ fontSize: '0.6rem' }} /> Best Seller</span>}

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
        <div className="product-card-price-row">
          <span className="product-card-price">
            ₹{Number(effectivePrice).toLocaleString('en-IN')}
          </span>
          {p.discountPrice && p.price && (
            <span className="product-card-original-price">
              ₹{Number(p.price).toLocaleString('en-IN')}
            </span>
          )}
        </div>
        {outOfStock && (
          <div className="product-card-stock-note">Out of stock</div>
        )}
      </div>
    </Link>
  )
}

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [all, setAll] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [slowLoad, setSlowLoad] = useState(false)

  const activeCategory = searchParams.get('cat') || 'All'

  useEffect(() => {
    // After 5s show a gentle "server waking up" notice
    const slowTimer = setTimeout(() => setSlowLoad(true), 5000)

    // getProducts() returns only status === 'active' products from the backend
    getProducts().then(list => {
      clearTimeout(slowTimer)
      setAll(list)
      setIsLoading(false)
      setSlowLoad(false)
    })

    return () => clearTimeout(slowTimer)
  }, [])

  // Reset page on filter/search change
  useEffect(() => { setPage(1) }, [activeCategory, query])

  // SEO: dynamic page title
  useEffect(() => {
    document.title = activeCategory === 'All'
      ? 'Shop Men\'s Collection — Aryan Designer Studio'
      : `${activeCategory} — Aryan Designer Studio`
    return () => { document.title = 'Aryan Designer Studio' }
  }, [activeCategory])

  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('ads_cart') || '[]'))

  useEffect(() => {
    function handleStorage() {
      setCart(JSON.parse(localStorage.getItem('ads_cart') || '[]'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function setCategory(cat) {
    if (cat === 'All') setSearchParams({})
    else setSearchParams({ cat })
  }

  const filtered = all
    .filter(p => activeCategory === 'All' ? true : p.category === activeCategory)
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function addToCart(e, p) {
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
    }
    else currentCart.push({ id: p.id, name: p.name, price: p.discountPrice || p.price, quantity: 1, size: 'M', image: p.thumbnail || p.images?.[0], stock: p.stock ?? null })
    localStorage.setItem('ads_cart', JSON.stringify(currentCart))
    window.dispatchEvent(new Event('storage'))
  }

  return (
    <>
      {/* Page Header */}
      <div className="products-page-header">
        <div className="container">
          <h1>Men's Collection</h1>
          <p>Premium styles for the modern gentleman</p>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="filter-pills" style={{ display: 'flex' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`filter-pill${activeCategory === cat ? ' active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="container">
        {/* Top bar */}
        <div className="shop-top-bar">
          <span className="shop-count">
            {isLoading
              ? '…'
              : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}${activeCategory !== 'All' ? ` in ${activeCategory}` : ''}`
            }
          </span>
          <div className="search-input-wrap">
            <span className="search-icon"><FaSearch /></span>
            <input
              className="search-input"
              placeholder="Search products…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Grid */}
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
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><FaSearch /></div>
            <p>No products found{activeCategory !== 'All' ? ` in "${activeCategory}"` : ''}.</p>
            {activeCategory !== 'All' && (
              <button className="btn btn-dark btn-sm" style={{ marginTop: '1rem' }} onClick={() => setCategory('All')}>
                View All Products
              </button>
            )}
          </div>
        ) : (
          <div className="products-grid">
            {list.map(p => (
              <ProductListCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            {/* Prev */}
            <button
              className="pg-btn pg-prev"
              onClick={() => { setPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={page === 1}
            >
              ‹ Prev
            </button>

            {/* Smart windowed page numbers */}
            {(() => {
              const pages = []
              const delta = 2 // pages on each side of current
              const range = []
              for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
                range.push(i)
              }

              // Always show page 1
              pages.push(
                <button key={1} className={`pg-btn${page === 1 ? ' active' : ''}`} onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>1</button>
              )

              // Left ellipsis
              if (range[0] > 2) pages.push(<span key="l-dots" className="pg-dots">…</span>)

              // Middle range
              range.forEach(n => pages.push(
                <button key={n} className={`pg-btn${page === n ? ' active' : ''}`} onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{n}</button>
              ))

              // Right ellipsis
              if (range[range.length - 1] < totalPages - 1) pages.push(<span key="r-dots" className="pg-dots">…</span>)

              // Always show last page
              if (totalPages > 1) pages.push(
                <button key={totalPages} className={`pg-btn${page === totalPages ? ' active' : ''}`} onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>{totalPages}</button>
              )

              return pages
            })()}

            {/* Next */}
            <button
              className="pg-btn pg-next"
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
              disabled={page === totalPages}
            >
              Next ›
            </button>

            <span className="pg-info">Page {page} of {totalPages} &nbsp;·&nbsp; {filtered.length} products</span>
          </div>
        )}
      </div>
    </>
  )
}
