// All functions are ASYNC and talk to the backend API
// In production: VITE_API_URL = https://your-render-backend.onrender.com
// In dev: empty string (Vite proxy handles /api → localhost:5000)
const BASE = import.meta.env.VITE_API_URL || ''
const API_URL = `${BASE}/api/products`

// ── Keep-alive ping (called by App.jsx every 14 min) ────────────────────────
// Fire-and-forget — just wakes the Render free-tier server, no return value needed
export async function pingBackend() {
  try {
    await fetch(`${BASE}/api/ping`, { cache: 'no-store' })
  } catch { /* ignore — network may be offline */ }
}

// ── Read (public — active products only) ────────────────────────────────────
// Retries up to MAX_RETRIES times with increasing delays so that products
// appear automatically after a Render free-tier cold start (30–60 s wakeup).
const RETRY_DELAYS_MS = [1_000, 5_000, 10_000, 15_000, 20_000] // ~51 s total window
const MAX_RETRIES = RETRY_DELAYS_MS.length

export async function getProducts() {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(API_URL, { cache: 'no-store' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return await res.json()
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        console.error('[getProducts] All retries exhausted:', err.message)
        return []
      }
      const delay = RETRY_DELAYS_MS[attempt]
      console.warn(`[getProducts] Attempt ${attempt + 1} failed. Retrying in ${delay / 1000}s…`)
      await new Promise(r => setTimeout(r, delay))
    }
  }
  return []
}

// ── Read all products including drafts (admin) ───────────────────────────────
export async function getAllProducts(ownerPassword) {
  try {
    const res = await fetch(`${API_URL}/all`, {
      headers: { 'x-owner-password': ownerPassword },
    })
    if (!res.ok) throw new Error('Failed to fetch all products')
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
      body: JSON.stringify({ password }),
    })
    return res.ok
  } catch {
    return false
  }
}

// ── Forgot Password — Step 1: Request OTP ────────────────────────────────────
export async function requestOTP() {
  const res = await fetch(`${BASE}/api/auth/forgot-password`, { method: 'POST' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Failed to send OTP')
  return data // { success, token, message, dev? }
}

// ── Forgot Password — Step 2: Verify OTP ─────────────────────────────────────
export async function verifyOTP(token, otp) {
  const res = await fetch(`${BASE}/api/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, otp }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'OTP verification failed')
  return data // { success, resetToken }
}

// ── Forgot Password — Step 3: Reset Password ──────────────────────────────────
export async function resetPassword(resetToken, newPassword) {
  const res = await fetch(`${BASE}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resetToken, newPassword }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Password reset failed')
  return data
}

// ── Upload images to Cloudinary via backend ──────────────────────────────────
/**
 * @param {File[]} files - Array of File objects from the file picker or drag-drop
 * @param {string} ownerPassword
 * @param {function} onProgress - optional callback(percentDone: number)
 * @returns {{ urls: string[], thumbnail: string }}
 */
export async function uploadImages(files, ownerPassword, onProgress) {
  const formData = new FormData()
  files.forEach(file => formData.append('images', file))

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100))
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText))
      } else {
        const err = (() => { try { return JSON.parse(xhr.responseText) } catch { return {} } })()
        reject(new Error(err.error || `Upload failed (${xhr.status})`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Network error during upload.')))
    xhr.addEventListener('abort', () => reject(new Error('Upload was cancelled.')))

    xhr.open('POST', `${BASE}/api/products/upload-images`)
    xhr.setRequestHeader('x-owner-password', ownerPassword)
    xhr.send(formData)
  })
}

// ── Add single product (owner) ───────────────────────────────────────────────
export async function addProduct(product, ownerPassword) {
  const res = await fetch(`${API_URL}/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-password': ownerPassword,
    },
    body: JSON.stringify(product),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to add product')
  }
  return await res.json()
}

// ── Update single product (owner) ────────────────────────────────────────────
export async function updateProduct(id, product, ownerPassword) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-password': ownerPassword,
    },
    body: JSON.stringify(product),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to update product')
  }
  return await res.json()
}

// ── Delete product (owner) ────────────────────────────────────────────────────
export async function deleteProduct(id, ownerPassword) {
  const res = await fetch(`${API_URL}/${id}`, {
    method: 'DELETE',
    headers: { 'x-owner-password': ownerPassword },
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to delete product')
  }
  return await res.json()
}

// ── Bulk save (owner) — kept for backward compat ──────────────────────────────
export async function saveProducts(list, ownerPassword = '') {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-owner-password': ownerPassword,
    },
    body: JSON.stringify(list),
  })
  if (!res.ok) throw new Error('Failed to save products')
  return await res.json()
}

// ── Legacy helpers ─────────────────────────────────────────────────────────────
export async function resetToDefault() {
  console.warn('resetToDefault: not implemented on server')
}
