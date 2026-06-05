import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import { FaSpinner, FaTruck, FaWhatsapp, FaTrophy, FaStar, FaFire, FaCheckCircle, FaChevronLeft, FaChevronRight, FaArrowLeft } from 'react-icons/fa'
import { GiSewingNeedle } from 'react-icons/gi'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prod, setProd] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [added, setAdded] = useState(false)
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('ads_cart') || '[]'))

  useEffect(() => {
    function handleStorage() {
      setCart(JSON.parse(localStorage.getItem('ads_cart') || '[]'))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  useEffect(() => {
    getProducts().then(list => {
      const p = list.find(item => item.id === id)
      if (p) {
        setProd(p)
        setSelectedIndex(0)
        // Pre-select first size/color
        if (p.sizes?.length > 0) setSelectedSize(p.sizes[0])
        if (p.colors?.length > 0) setSelectedColor(p.colors[0])
      }
    })
  }, [id])

  // Gallery navigation — wrap-around
  const galleryImages = (() => {
    if (!prod) return []
    const all = []
    if (prod.thumbnail) all.push(prod.thumbnail)
    ;(prod.images || []).forEach(img => { if (img && !all.includes(img)) all.push(img) })
    return all
  })()

  const goPrev = useCallback(() => {
    setSelectedIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)
  }, [galleryImages.length])

  const goNext = useCallback(() => {
    setSelectedIndex(i => (i + 1) % galleryImages.length)
  }, [galleryImages.length])

  // Keyboard navigation
  useEffect(() => {
    if (!prod || galleryImages.length <= 1) return
    function onKey(e) {
      if (e.key === 'ArrowLeft')  goPrev()
      if (e.key === 'ArrowRight') goNext()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prod, galleryImages.length, goPrev, goNext])

  function addToCart() {
    if (!prod) return
    const outOfStock = prod.stock === 0 || prod.soldOut
    if (outOfStock) return

    const currentCart = JSON.parse(localStorage.getItem('ads_cart') || '[]')
    const effectivePrice = prod.discountPrice || prod.price
    const found = currentCart.find(i => i.id === prod.id && i.size === (selectedSize || 'M'))
    if (found) {
      if (prod.stock !== undefined && prod.stock !== null && found.quantity >= prod.stock) {
        alert(`Cannot add more. Only ${prod.stock} item(s) in stock.`);
        return
      }
      found.quantity += 1
    } else {
      currentCart.push({
        id: prod.id,
        name: prod.name,
        price: effectivePrice,
        quantity: 1,
        size: selectedSize || 'M',
        color: selectedColor || '',
        image: prod.thumbnail || prod.images?.[0],
        stock: prod.stock ?? null,
      })
    }
    localStorage.setItem('ads_cart', JSON.stringify(currentCart))
    window.dispatchEvent(new Event('storage'))
    setAdded(true)
    setTimeout(() => setAdded(false), 2200)
  }

  if (!prod) {
    return (
      <div className="container" style={{ padding: '6rem 2rem', textAlign: 'center', color: 'var(--muted)' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--gold)' }}><FaSpinner /></div>
        <p>Loading product…</p>
      </div>
    )
  }

  const outOfStock = prod.stock === 0 || prod.soldOut
  const cartItem = prod ? cart.find(i => i.id === prod.id && i.size === (selectedSize || 'M')) : null
  const isMaxStock = cartItem && prod && prod.stock !== undefined && prod.stock !== null && cartItem.quantity >= prod.stock
  const effectivePrice = prod.discountPrice || prod.price
  const discount = prod.discountPrice && prod.price
    ? Math.round(((prod.price - prod.discountPrice) / prod.price) * 100)
    : null

  const handleBack = () => {
    if (!window.history.state || !window.history.state.idx || window.history.state.idx === 0) {
      navigate('/products')
    } else {
      navigate(-1)
    }
  }

  // Sizes to show (from new schema or fallback)
  const availableSizes = prod.sizes?.length > 0
    ? prod.sizes
    : !['Belts', 'Branded Shoes', 'Watches', 'Underwear'].includes(prod.category)
      ? ['XS', 'S', 'M', 'L', 'XL', 'XXL']
      : []

  return (
    <div className="container product-detail-page">
      {/* Back button */}
      <button
        className="btn btn-dark"
        onClick={handleBack}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}
      >
        <FaArrowLeft /> Back
      </button>

      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-main-img">
            <img src={galleryImages[selectedIndex] || galleryImages[0]} alt={prod.name} />

            {/* ‹ › Arrow buttons */}
            {galleryImages.length > 1 && (
              <>
                <button
                  className="pd-arrow pd-arrow-left"
                  onClick={goPrev}
                  aria-label="Previous image"
                >
                  <FaChevronLeft />
                </button>
                <button
                  className="pd-arrow pd-arrow-right"
                  onClick={goNext}
                  aria-label="Next image"
                >
                  <FaChevronRight />
                </button>

                {/* Dot indicators */}
                <div className="pd-dots">
                  {galleryImages.map((_, i) => (
                    <button
                      key={i}
                      className={`pd-dot${i === selectedIndex ? ' active' : ''}`}
                      onClick={() => setSelectedIndex(i)}
                      aria-label={`Image ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          {galleryImages.length > 1 && (
            <div className="pd-thumbs">
              {galleryImages.map((img, i) => (
                <div
                  key={i}
                  className={`pd-thumb${i === selectedIndex ? ' active' : ''}`}
                  onClick={() => setSelectedIndex(i)}
                >
                  <img src={img} alt={`view ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="pd-info">
          {/* Badges row */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
            {prod.newArrival && (
              <span className="pd-badge pd-badge-new">✦ New Arrival</span>
            )}
            {prod.bestSeller && (
              <span className="pd-badge pd-badge-bestseller"><FaFire style={{ marginRight: '3px' }} />Best Seller</span>
            )}
            {prod.featured && (
              <span className="pd-badge pd-badge-featured"><FaStar style={{ marginRight: '3px' }} />Featured</span>
            )}
          </div>

          {prod.category && <div className="pd-category">{prod.category}{prod.subcategory ? ` · ${prod.subcategory}` : ''}</div>}
          {prod.brand && <div className="pd-brand">{prod.brand}</div>}
          <h1 className="pd-name">{prod.name}</h1>

          {/* Price */}
          <div className="pd-price-row">
            <span className="pd-price">₹{Number(effectivePrice).toLocaleString('en-IN')}</span>
            {prod.discountPrice && (
              <>
                <span className="pd-original-price">₹{Number(prod.price).toLocaleString('en-IN')}</span>
                <span className="pd-discount-badge">{discount}% OFF</span>
              </>
            )}
          </div>

          {/* Stock */}
          {outOfStock ? (
            <div className="pd-stock-out">Out of Stock</div>
          ) : prod.stock && prod.stock <= 5 ? (
            <div className="pd-stock-low">Only {prod.stock} left in stock!</div>
          ) : null}

          {/* Fabric */}
          {prod.fabric && (
            <div className="pd-fabric"><GiSewingNeedle style={{ marginRight: '0.35rem' }} />Fabric: {prod.fabric}</div>
          )}

          {/* Description */}
          {prod.description && <p className="pd-description">{prod.description}</p>}

          {/* Colors */}
          {prod.colors?.length > 0 && (
            <div className="pd-attribute">
              <div className="pd-size-label">Color: <strong>{selectedColor}</strong></div>
              <div className="pd-color-pills">
                {prod.colors.map(color => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`color-pill${selectedColor === color ? ' active' : ''}`}
                    title={color}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {availableSizes.length > 0 && (
            <div className="pd-attribute">
              <div className="pd-size-label">
                Select Size{selectedSize ? `: ${selectedSize}` : ''}
              </div>
              <div className="size-pills">
                {availableSizes.map(sz => (
                  <button
                    key={sz}
                    className={`size-pill${selectedSize === sz ? ' active' : ''}`}
                    onClick={() => setSelectedSize(sz)}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {prod.tags?.length > 0 && (
            <div className="pd-tags">
              {prod.tags.map(tag => (
                <span key={tag} className="pd-tag">#{tag}</span>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="pd-actions">
            {outOfStock ? (
              <button className="btn btn-ghost" disabled>Out of Stock</button>
            ) : isMaxStock ? (
              <button className="btn btn-ghost" disabled style={{ cursor: 'not-allowed' }}>Limit Reached</button>
            ) : (
              <button
                className="btn btn-dark btn-lg"
                onClick={addToCart}
                style={added ? { background: '#22543d' } : {}}
              >
                {added ? <><FaCheckCircle style={{ marginRight: '0.4rem' }} />Added to Cart!</> : 'Add to Cart'}
              </button>
            )}
            <Link to="/cart" className="btn btn-outline btn-lg">View Cart</Link>
          </div>

          {/* Trust badges */}
          <div className="pd-trust">
            <div className="pd-trust-item"><span><FaTruck /></span> Fast Delivery</div>
            <div className="pd-trust-item"><span><FaWhatsapp /></span> Order via WhatsApp</div>
            <div className="pd-trust-item"><span><FaTrophy /></span> Premium Quality</div>
          </div>
        </div>
      </div>
    </div>
  )
}
