import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import { FaSearch, FaStar, FaFire } from 'react-icons/fa'

const CATEGORIES = [
  'All', 'Shirts', 'Pants', 'T-Shirts', 'Formal Shirts & Pants',
  'Shirt & Pant Sets', 'Formal Sets',
  'Belts', 'Branded Shoes', 'Watches', 'Accessories',
]

const PAGE_SIZE = 30

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [all, setAll] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const activeCategory = searchParams.get('cat') || 'All'

  useEffect(() => {
    // getProducts() returns only status === 'active' products from the backend
    getProducts().then(list => setAll(list))
  }, [])

  // Reset page on filter/search change
  useEffect(() => { setPage(1) }, [activeCategory, query])

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
    const cart = JSON.parse(localStorage.getItem('ads_cart') || '[]')
    const found = cart.find(i => i.id === p.id && i.size === 'M')
    if (found) found.quantity += 1
    else cart.push({ id: p.id, name: p.name, price: p.discountPrice || p.price, quantity: 1, size: 'M', image: p.thumbnail || p.images?.[0], stock: p.stock ?? null })
    localStorage.setItem('ads_cart', JSON.stringify(cart))
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
            {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            {activeCategory !== 'All' && ` in ${activeCategory}`}
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
        {list.length === 0 ? (
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
            {list.map(p => {
              const thumb = p.thumbnail || p.images?.[0]
              const outOfStock = p.stock === 0 || p.soldOut
              const effectivePrice = p.discountPrice || p.price

              return (
                <Link to={`/product/${p.id}`} key={p.id} className="product-card" style={{ display: 'block' }}>
                  <div className="product-card-img">
                    {thumb && <img loading="lazy" src={thumb} alt={p.name} />}
                    {outOfStock && <span className="sold-out-badge">Out of Stock</span>}
                    {!outOfStock && p.newArrival && <span className="new-badge">New</span>}
                    {!outOfStock && p.bestSeller && <span className="bestseller-badge"><FaFire style={{ fontSize: '0.6rem' }} /> Best Seller</span>}

                    <div className="quick-add-overlay">
                      <button
                        className="quick-add-btn"
                        onClick={e => addToCart(e, p)}
                        disabled={outOfStock}
                      >
                        {outOfStock ? 'Out of Stock' : '+ Add to Cart'}
                      </button>
                    </div>
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
            })}
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
