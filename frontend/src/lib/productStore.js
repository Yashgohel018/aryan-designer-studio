// All functions are ASYNC and talk to the backend API
// In production: VITE_API_URL = https://your-render-backend.onrender.com
// In dev: empty string (Vite proxy handles /api → localhost:5000)
const BASE = import.meta.env.VITE_API_URL || ''
const API_URL = `${BASE}/api/products`

// ── Read ────────────────────────────────────────────────────────────────────
export async function getProducts() {
  try {
    const res = await fetch(API_URL)
    if (!res.ok) throw new Error('Failed to fetch products')
    return await res.json()
  } catch (err) {
    console.error(err)
    return []
  }
}

// ── Owner Auth ───────────────────────────────────────────────────────────────
export async function verifyOwner(password) {
  try {
    const res = await fetch(`${BASE}/api/auth/owner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Add single product (owner) ───────────────────────────────────────────────
export async function addProduct(product, ownerPassword) {
  const res = await fetch(`${BASE}/api/products/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-password': ownerPassword
    },
    body: JSON.stringify(product)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to add product')
  }
  return await res.json()
}

// ── Update single product (owner) ────────────────────────────────────────────
export async function updateProduct(id, product, ownerPassword) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-password': ownerPassword
    },
    body: JSON.stringify(product)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update product')
  }
  return await res.json()
}

// ── Delete product (owner) ────────────────────────────────────────────────────
export async function deleteProduct(id, ownerPassword) {
  const res = await fetch(`${BASE}/api/products/${id}`, {
    method: 'DELETE',
    headers: { 'x-owner-password': ownerPassword }
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete product')
  }
  return await res.json()
}

// ── Bulk save (owner) ─────────────────────────────────────────────────────────
export async function saveProducts(list, ownerPassword = '') {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-password': ownerPassword
    },
    body: JSON.stringify(list)
  })
  if (!res.ok) throw new Error('Failed to save products')
  return await res.json()
}

// ── Legacy helpers kept for compatibility ─────────────────────────────────────
export async function resetToDefault() {
  console.warn('resetToDefault: not implemented on server')
}
