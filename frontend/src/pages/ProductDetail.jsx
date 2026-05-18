import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import { FaSpinner, FaTruck, FaWhatsapp, FaTrophy } from 'react-icons/fa'
import { GiSewingNeedle } from 'react-icons/gi'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [prod, setProd] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [size, setSize] = useState('M')
  const [added, setAdded] = useState(false)

  useEffect(() => {
    getProducts().then(list => {
      const p = list.find(item => item.id === id)
      if (p) { setProd(p); setSelectedImage(p.images?.[0] || '') }
    })
  }, [id])

  function addToCart() {
    if (!prod || prod.soldOut) return
    const cart = JSON.parse(localStorage.getItem('ads_cart') || '[]')
    const found = cart.find(i => i.id === prod.id && i.size === size)
    if (found) found.quantity += 1
    else cart.push({ id: prod.id, name: prod.name, price: prod.price, quantity: 1, size, image: prod.images?.[0] })
    localStorage.setItem('ads_cart', JSON.stringify(cart))
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

  return (
    <div className="container product-detail-page">
      {/* Breadcrumb */}
      <nav style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '2rem', display: 'flex', gap: '0.4rem' }}>
        <Link to="/">Home</Link> <span>/</span>
        <Link to="/products">Shop</Link> <span>/</span>
        <span style={{ color: 'var(--black)' }}>{prod.name}</span>
      </nav>

      <div className="product-detail-grid">
        {/* Gallery */}
        <div className="pd-gallery">
          <div className="pd-main-img">
            <img src={selectedImage || prod.images?.[0]} alt={prod.name} />
          </div>
          {prod.images?.length > 1 && (
            <div className="pd-thumbs">
              {prod.images.map((img, i) => (
                <div
                  key={i}
                  className={`pd-thumb${selectedImage === img ? ' active' : ''}`}
                  onClick={() => setSelectedImage(img)}
                >
                  <img src={img} alt={`view ${i + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pd-info">
          {prod.category && <div className="pd-category">{prod.category}</div>}
          <h1 className="pd-name">{prod.name}</h1>
          <div className="pd-price">₹{prod.price?.toLocaleString('en-IN')}</div>
          {prod.fabric && <div className="pd-fabric"><GiSewingNeedle style={{ marginRight: '0.35rem' }} />Fabric: {prod.fabric}</div>}
          {prod.description && <p className="pd-description">{prod.description}</p>}

          {/* Size selector */}
          {!['Belts', 'Branded Shoes', 'Watches', 'Underwear'].includes(prod.category) && (
            <>
              <div className="pd-size-label">Select Size</div>
              <div className="size-pills">
                {SIZES.map(s => (
                  <button
                    key={s}
                    className={`size-pill${size === s ? ' active' : ''}`}
                    onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="pd-actions">
            {prod.soldOut ? (
              <button className="btn btn-ghost" disabled>Sold Out</button>
            ) : (
              <button
                className="btn btn-dark btn-lg"
                onClick={addToCart}
                style={added ? { background: '#22543d' } : {}}
              >
                {added ? '✓ Added to Cart!' : 'Add to Cart'}
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
