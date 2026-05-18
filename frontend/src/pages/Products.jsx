import React, { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import { FaSearch } from 'react-icons/fa'

const CATEGORIES = [
  'All',
  'Shirts',
  'Pants',
  'T-Shirts',
  'Formal Shirts & Pants',
  'Shirt & Pant Sets',
  'Formal Sets',
  'T-Shirt Sets',
  'Belts',
  'Branded Shoes',
  'Watches',
  'Underwear',
]

const PAGE_SIZE = 24

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [all, setAll] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const activeCategory = searchParams.get('cat') || 'All'

  useEffect(() => {
    getProducts().then(list => setAll(list))
  }, [])

  // Reset page on filter/search change
  useEffect(() => { setPage(1) }, [activeCategory, query])

  function setCategory(cat) {
    if (cat === 'All') {
      setSearchParams({})
    } else {
      setSearchParams({ cat })
    }
  }

  const filtered = all
    .filter(p => activeCategory === 'All' ? true : p.category === activeCategory)
    .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const list = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function addToCart(e, p) {
    e.preventDefault()
    if (p.soldOut) { alert('This item is sold out.'); return }
    const cart = JSON.parse(localStorage.getItem('ads_cart') || '[]')
    const found = cart.find(i => i.id === p.id && i.size === 'M')
    if (found) found.quantity += 1
    else cart.push({ id: p.id, name: p.name, price: p.price, quantity: 1, size: 'M', image: p.images?.[0] })
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

      {/* Mobile pill filters */}
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
            {list.map(p => (
              <Link to={`/product/${p.id}`} key={p.id} className="product-card" style={{ display: 'block' }}>
                <div className="product-card-img">
                  <img loading="lazy" src={p.images?.[0]} alt={p.name} />
                  {p.soldOut && <span className="sold-out-badge">Sold Out</span>}
                  <div className="quick-add-overlay">
                    <button className="quick-add-btn" onClick={e => addToCart(e, p)} disabled={p.soldOut}>
                      {p.soldOut ? 'Sold Out' : '+ Add to Cart'}
                    </button>
                  </div>
                </div>
                <div className="product-card-body">
                  {p.category && <div className="product-card-category">{p.category}</div>}
                  <div className="product-card-name">{p.name}</div>
                  <div className="product-card-price">₹{p.price?.toLocaleString('en-IN')}</div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button className="pg-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const p = i + 1
              return (
                <button
                  key={p}
                  className={`pg-btn${page === p ? ' active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              )
            })}
            <button className="pg-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
            <span className="pg-info">Page {page} / {totalPages}</span>
          </div>
        )}
      </div>
    </>
  )
}
