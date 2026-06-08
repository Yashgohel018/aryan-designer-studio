import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../lib/productStore'
import { FaShoppingBag, FaWhatsapp } from 'react-icons/fa'

const ENV_WHATSAPP = import.meta.env.VITE_OWNER_WHATSAPP
const OWNER_WHATSAPP = ENV_WHATSAPP || '+916355220940'

export default function Cart() {
  const [items, setItems] = useState(() => JSON.parse(localStorage.getItem('ads_cart') || '[]'))
  const [productImages, setProductImages] = useState({})

  useEffect(() => {
    localStorage.setItem('ads_cart', JSON.stringify(items))
    window.dispatchEvent(new Event('storage'))
  }, [items])

  useEffect(() => {
    // Only fetch product list if some cart items are missing their stored image
    // (items added via Add to Cart already have image stored — this is just a fallback)
    const missingImages = items.some(it => !it.image)
    if (!missingImages) return

    getProducts().then(list => {
      const map = {}
      list.forEach(p => { map[p.id] = p.images?.[0] })
      setProductImages(map)
    })
  }, [])

  function changeQty(idx, delta) {
    setItems(prev => {
      const copy = [...prev]
      const item = copy[idx]
      const stock = item.stock ?? Infinity
      const newQty = Math.max(1, Math.min(stock, item.quantity + delta))
      copy[idx] = { ...item, quantity: newQty }
      return copy
    })
  }

  function removeItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)

  function sendWhatsApp() {
    if (items.length === 0) { alert('Cart is empty'); return }
    let msg = `Hello Aryan Designer Studio! I'd like to place an order:\n\n`
    items.forEach((it, idx) => {
      const imgUrl = it.image || productImages[it.id] || ''
      msg += `${idx + 1}. *${it.name}*\n`
      msg += `   • Size: ${it.size}\n`
      msg += `   • Price: Rs.${it.price} x ${it.quantity} = Rs.${it.price * it.quantity}\n`
      if (imgUrl) {
        msg += `   • Image: ${imgUrl}\n`
      }
      msg += `\n`
    })
    msg += `*Total: Rs.${subtotal.toLocaleString('en-IN')}*\n\nPlease confirm my order. Thank you!`
    const phone = OWNER_WHATSAPP.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  return (
    <div className="cart-page">
      <div className="container">
        <div className="cart-page-header">
          <h1>Your Cart</h1>
          {items.length > 0 && <p className="text-muted">{items.length} item{items.length !== 1 ? 's' : ''}</p>}
        </div>

        {items.length === 0 ? (
          <div className="cart-empty">
            <div style={{ fontSize: '4rem', color: 'var(--gold)' }}><FaShoppingBag /></div>
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-dark btn-lg">Start Shopping</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items-panel">
              {items.map((it, idx) => (
                <div className="cart-item" key={idx}>
                  {(it.image || productImages[it.id]) && (
                    <Link to={`/product/${it.id}`}>
                      <img className="cart-item-img" src={it.image || productImages[it.id]} alt={it.name} />
                    </Link>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/product/${it.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <div className="cart-item-name" style={{ cursor: 'pointer' }}>{it.name}</div>
                    </Link>
                    <div className="cart-item-meta">Size: {it.size}</div>
                    <div className="cart-item-price">₹{(it.price * it.quantity).toLocaleString('en-IN')}</div>
                    <div className="qty-control">
                      <button className="qty-btn" onClick={() => changeQty(idx, -1)}>−</button>
                      <span className="qty-num">{it.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => changeQty(idx, 1)}
                        disabled={it.stock != null && it.quantity >= it.stock}
                        title={it.stock != null && it.quantity >= it.stock ? 'Maximum stock reached' : ''}
                      >+</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>₹{(it.price * it.quantity).toLocaleString('en-IN')}</div>
                    <button className="cart-item-remove" onClick={() => removeItem(idx)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-line"><span>Subtotal</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <div className="summary-line"><span>Delivery</span><span style={{ color: '#22543d' }}>Calculated on order</span></div>
              <div className="summary-total"><span>Total</span><span>₹{subtotal.toLocaleString('en-IN')}</span></div>
              <button className="btn btn-wa" style={{ width: '100%', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }} onClick={sendWhatsApp}>
                <FaWhatsapp /> Order via WhatsApp
              </button>
              <Link to="/products" className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }}>
                Continue Shopping
              </Link>
              <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textAlign: 'center', marginTop: '1rem', lineHeight: 1.6 }}>
                Your order details will be sent to Krish Aryan on WhatsApp for confirmation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
