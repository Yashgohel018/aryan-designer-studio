import React, { useState, useEffect, useRef, useCallback } from 'react'
import { getProducts, verifyOwner, addProduct, updateProduct, deleteProduct } from '../lib/productStore'
import {
  FaSearch, FaEdit, FaTrash, FaBoxOpen, FaChartBar, FaEye, FaEyeSlash,
  FaTrophy, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaSpinner,
  FaInbox, FaExclamationTriangle, FaTable, FaTh, FaTimes, FaWhatsapp,
} from 'react-icons/fa'
import {
  GiShirt, GiArmoredPants, GiTShirt, GiTie, GiClothes, GiBelt,
  GiRunningShoe, GiWatch, GiUnderwear, GiSuitcase, GiSewingNeedle,
} from 'react-icons/gi'
import { MdOutlineCheckroom } from 'react-icons/md'

/* ── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  'Shirts', 'Pants', 'T-Shirts', 'Formal Shirts & Pants',
  'Shirt & Pant Sets', 'Formal Sets', 'T-Shirt Sets',
  'Belts', 'Branded Shoes', 'Watches', 'Underwear',
]

const EMPTY_FORM = {
  name: '', price: '', category: 'Shirts',
  fabric: '', description: '', images: '', soldOut: false,
}

const CAT_ICONS = {
  'Shirts': <GiShirt />, 'Pants': <GiArmoredPants />, 'T-Shirts': <GiTShirt />,
  'Formal Shirts & Pants': <GiSuitcase />, 'Shirt & Pant Sets': <GiClothes />,
  'Formal Sets': <GiTie />, 'T-Shirt Sets': <MdOutlineCheckroom />,
  'Belts': <GiBelt />, 'Branded Shoes': <GiRunningShoe />,
  'Watches': <GiWatch />, 'Underwear': <GiUnderwear />,
}

/* ══════════════════════════════════════════════════════════════════════════
   LOGIN SCREEN
══════════════════════════════════════════════════════════════════════════ */
function LoginScreen({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    const ok = await verifyOwner(pwd)
    setLoading(false)
    if (ok) onLogin(pwd)
    else { setErr('Incorrect password. Try again.'); setPwd('') }
  }

  return (
    <div style={styles.loginBg}>
      <div style={styles.loginCard}>
        {/* Logo / Icon */}
        <div style={styles.loginLogo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div style={styles.loginBrand}>Aryan Designer Studio</div>
        <h1 style={styles.loginTitle}>Owner Dashboard</h1>
        <p style={styles.loginSub}>Enter your owner password to manage the store</p>

        <form onSubmit={handleSubmit} style={styles.loginForm}>
          <div style={styles.pwdWrap}>
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="Owner password"
              autoFocus
              style={{ ...styles.pwdInput, ...(err ? styles.pwdInputErr : {}) }}
            />
            <button type="button" onClick={() => setShow(s => !s)} style={styles.eyeBtn}>
              {show ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {err && <p style={styles.errText}>{err}</p>}
          <button type="submit" disabled={loading || !pwd} style={styles.loginBtn}>
            {loading ? '…' : 'Enter Dashboard →'}
          </button>
        </form>

        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '1.5rem' }}>
          Aryan Designer Studio · Owner Access Only
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCT MODAL (Add / Edit)
══════════════════════════════════════════════════════════════════════════ */
function ProductModal({ form, editing, loading, onClose, onChange, onSubmit }) {
  const imgUrls = form.images.split(',').map(s => s.trim()).filter(Boolean)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  return (
    <div style={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>{editing ? <><FaEdit style={{ marginRight: '0.4rem' }} /> Edit Product</> : '+ Add New Product'}</h2>
          <button onClick={onClose} style={styles.modalCloseBtn}><FaTimes /></button>
        </div>

        <form onSubmit={onSubmit} style={styles.modalForm}>
          {/* Row 1: Name + Price */}
          <div style={styles.formRow2}>
            <div style={styles.formField}>
              <label style={styles.label}>Product Name <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                name="name" value={form.name} onChange={onChange}
                placeholder="e.g. Classic White Shirt"
                style={styles.input} required
              />
            </div>
            <div style={{ ...styles.formField, maxWidth: 150 }}>
              <label style={styles.label}>Price (₹) <span style={{ color: '#e53e3e' }}>*</span></label>
              <input
                name="price" type="number" min="0" value={form.price} onChange={onChange}
                placeholder="e.g. 1299"
                style={styles.input} required
              />
            </div>
          </div>

          {/* Row 2: Category + Fabric */}
          <div style={styles.formRow2}>
            <div style={styles.formField}>
              <label style={styles.label}>Category</label>
              <select name="category" value={form.category} onChange={onChange} style={styles.input}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={styles.formField}>
              <label style={styles.label}>Fabric / Material</label>
              <input
                name="fabric" value={form.fabric} onChange={onChange}
                placeholder="e.g. Pure Cotton, Silk Blend"
                style={styles.input}
              />
            </div>
          </div>

          {/* Description */}
          <div style={styles.formField}>
            <label style={styles.label}>Description</label>
            <textarea
              name="description" value={form.description} onChange={onChange}
              placeholder="Short product description that will appear on the product page..."
              rows={3} style={{ ...styles.input, resize: 'vertical', lineHeight: 1.6 }}
            />
          </div>

          {/* Images */}
          <div style={styles.formField}>
            <label style={styles.label}>
              Image URLs
              <span style={styles.labelHint}> — paste comma-separated image links</span>
            </label>
            <textarea
              name="images" value={form.images} onChange={onChange}
              placeholder="https://example.com/img1.jpg , https://example.com/img2.jpg"
              rows={2} style={{ ...styles.input, resize: 'vertical' }}
            />
            {imgUrls.length > 0 && (
              <div style={styles.imgPreviewRow}>
                {imgUrls.map((url, i) => (
                  <div key={i} style={styles.imgPreviewBox}>
                    <img
                      src={url} alt={`preview-${i}`}
                      style={styles.imgPreviewImg}
                      onError={e => { e.target.parentNode.style.display = 'none' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sold out toggle */}
          <label style={styles.toggleRow}>
            <div style={{ position: 'relative', width: 44, height: 24, flexShrink: 0 }}>
              <input
                type="checkbox" name="soldOut"
                checked={form.soldOut} onChange={onChange}
                style={{ opacity: 0, width: 0, height: 0, position: 'absolute' }}
                id="soldout-toggle"
              />
              <div
                style={{
                  ...styles.toggleTrack,
                  background: form.soldOut ? '#e53e3e' : '#ccc',
                }}
                onClick={() => onChange({ target: { name: 'soldOut', type: 'checkbox', checked: !form.soldOut } })}
              >
                <div style={{ ...styles.toggleThumb, left: form.soldOut ? 20 : 2 }} />
              </div>
            </div>
            <span style={{ fontSize: '0.9rem' }}>
              Mark as <strong>Sold Out</strong>
              {form.soldOut && <span style={{ color: '#e53e3e', marginLeft: '0.5rem', fontSize: '0.8rem' }}>— customers cannot add this to cart</span>}
            </span>
          </label>

          {/* Action buttons */}
          <div style={styles.modalFooter}>
            <button type="button" onClick={onClose} style={styles.cancelBtn}>Cancel</button>
            <button type="submit" disabled={loading} style={styles.submitBtn}>
              {loading ? 'Saving…' : editing ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN ADMIN DASHBOARD
══════════════════════════════════════════════════════════════════════════ */
export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [ownerPwd, setOwnerPwd] = useState('')

  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editing, setEditing] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [msg, setMsg] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'table'
  const [activeTab, setActiveTab] = useState('products') // 'products' | 'stats'

  useEffect(() => { if (authed) loadProducts() }, [authed])

  async function loadProducts() {
    setLoading(true)
    const list = await getProducts()
    setProducts(list)
    setLoading(false)
  }

  function showMsg(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  function openAdd() {
    setEditing(null); setForm(EMPTY_FORM); setShowModal(true)
  }

  function openEdit(product) {
    setEditing(product.id)
    const cat = CATEGORIES.includes(product.category) ? product.category : 'Shirts'
    setForm({
      name: product.name, price: String(product.price), category: cat,
      fabric: product.fabric || '', description: product.description || '',
      images: Array.isArray(product.images) ? product.images.join(', ') : (product.images || ''),
      soldOut: !!product.soldOut,
    })
    setShowModal(true)
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.price) { showMsg('error', 'Name and Price are required.'); return }
    const imagesArr = form.images.split(',').map(s => s.trim()).filter(Boolean)
    const payload = {
      name: form.name.trim(), price: Number(form.price), category: form.category,
      fabric: form.fabric.trim(), description: form.description.trim(),
      images: imagesArr, soldOut: form.soldOut,
    }
    setLoading(true)
    try {
      if (editing) {
        await updateProduct(editing, payload, ownerPwd)
        showMsg('success', `"${payload.name}" updated!`)
      } else {
        await addProduct(payload, ownerPwd)
        showMsg('success', `"${payload.name}" added to store!`)
      }
      setShowModal(false); setForm(EMPTY_FORM); setEditing(null)
      await loadProducts()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    setLoading(true)
    try {
      await deleteProduct(id, ownerPwd)
      showMsg('success', 'Product deleted.')
      setConfirmDel(null)
      if (editing === id) { setEditing(null); setForm(EMPTY_FORM) }
      await loadProducts()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setLoading(false)
    }
  }

  /* ── Derived data ── */
  const filtered = products
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase())
    )

  const stats = {
    total: products.length,
    soldOut: products.filter(p => p.soldOut).length,
    available: products.filter(p => !p.soldOut).length,
    totalValue: products.reduce((s, p) => s + (p.price || 0), 0),
    byCat: CATEGORIES.map(c => ({ cat: c, count: products.filter(p => p.category === c).length })),
  }

  /* ── Login gate ── */
  if (!authed) {
    return <LoginScreen onLogin={(pwd) => { setOwnerPwd(pwd); setAuthed(true) }} />
  }

  return (
    <div className="adm-dash" style={styles.dashRoot}>
      {/* ── Admin-specific responsive CSS ─────────────────────── */}
      <style>{`
        /* ── Admin Mobile — sidebar becomes bottom tab bar ───────── */
        @media (max-width: 768px) {
          /* Root layout: stacked column */
          .adm-dash { flex-direction: column !important; }

          /* Sidebar → fixed bottom tab bar */
          .adm-sidebar {
            width: 100% !important;
            height: 60px !important;
            min-height: 60px !important;
            position: fixed !important;
            bottom: 0; left: 0; right: 0;
            top: auto !important;
            flex-direction: row !important;
            align-items: center;
            z-index: 200;
            border-top: 1px solid rgba(255,255,255,0.1) !important;
            padding: 0 !important;
            box-shadow: 0 -4px 20px rgba(0,0,0,0.3) !important;
          }
          .adm-sidebar-brand { display: none !important; }
          .adm-sidebar-nav {
            flex-direction: row !important;
            flex: 1;
            padding: 0 !important;
            gap: 0 !important;
            height: 100%;
          }
          .adm-sidebar-nav button {
            flex: 1 !important;
            flex-direction: column !important;
            gap: 3px !important;
            padding: 0.5rem 0 !important;
            font-size: 0.65rem !important;
            border-radius: 0 !important;
            justify-content: center !important;
            align-items: center !important;
            border-right: 1px solid rgba(255,255,255,0.06) !important;
            height: 100%;
            letter-spacing: 0.04em !important;
          }
          .adm-sidebar-nav button svg { font-size: 1.3rem !important; width: 1.3rem !important; height: 1.3rem !important; }
          .adm-sidebar-bottom { display: none !important; }

          /* Main area: push content above bottom bar */
          .adm-main { padding-bottom: 72px !important; overflow-x: hidden !important; }

          /* Topbar */
          .adm-topbar { padding: 0.75rem 1rem !important; flex-wrap: wrap; gap: 0.5rem; }
          .adm-topbar h1 { font-size: 1rem !important; }
          .adm-topbar p { font-size: 0.7rem !important; }
          .adm-add-btn { font-size: 0.75rem !important; padding: 0.5rem 0.9rem !important; white-space: nowrap; }

          /* Tab content padding */
          .adm-tab-content { padding: 1rem !important; }

          /* Quick stats: 2×2 grid */
          .adm-quick-stats { grid-template-columns: 1fr 1fr !important; gap: 0.6rem !important; }

          /* Toolbar: stack vertically */
          .adm-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 0.75rem !important; }
          .adm-toolbar-left { flex-direction: column !important; gap: 0.6rem !important; }
          .adm-search-wrap { max-width: 100% !important; width: 100% !important; }
          .adm-search-wrap input { width: 100% !important; box-sizing: border-box !important; }
          .adm-cat-select { width: 100% !important; }

          /* Grid view: 2 columns */
          .adm-grid-view { grid-template-columns: repeat(2, 1fr) !important; gap: 0.7rem !important; }

          /* Table view: horizontally scrollable */
          .adm-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
          .adm-table { min-width: 560px !important; }

          /* Modal: bottom sheet on mobile */
          .adm-modal-overlay {
            padding: 0 !important;
            align-items: flex-end !important;
          }
          .adm-modal-card {
            max-width: 100% !important;
            width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            max-height: 90vh !important;
          }

          /* Form rows: single column */
          .adm-form-row2 { grid-template-columns: 1fr !important; }

          /* Analytics stats: 2×2 */
          .adm-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }

          /* Category breakdown */
          .adm-cat-left { width: 110px !important; font-size: 0.75rem !important; }

          /* Confirm dialog */
          .adm-confirm-card { margin: 1rem !important; width: calc(100% - 2rem) !important; }
        }

        /* ── 430px: small iPhones ──────────────────────────── */
        @media (max-width: 430px) {
          .adm-quick-stats { gap: 0.5rem !important; }
          .adm-grid-view { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
          .adm-grid-card-name { font-size: 0.78rem !important; }
          .adm-grid-card-price { font-size: 0.82rem !important; }
          .adm-tab-content { padding: 0.75rem !important; }
          .adm-topbar { padding: 0.65rem 0.75rem !important; }
          .adm-topbar h1 { font-size: 0.92rem !important; }
        }

        /* ── Safe area for iPhone notch ───────────────────── */
        @supports (padding: max(0px)) {
          @media (max-width: 768px) {
            .adm-sidebar {
              padding-bottom: max(0px, env(safe-area-inset-bottom)) !important;
              height: calc(60px + env(safe-area-inset-bottom)) !important;
            }
            .adm-main {
              padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important;
            }
          }
        }
      `}</style>

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside className="adm-sidebar" style={styles.sidebar}>
        <div className="adm-sidebar-brand" style={styles.sidebarBrand}>
          <div style={styles.sidebarBrandIcon}>A</div>
          <div>
            <div style={styles.sidebarBrandName}>Aryan Studio</div>
            <div style={styles.sidebarBrandSub}>Owner Panel</div>
          </div>
        </div>

        <nav className="adm-sidebar-nav" style={styles.sidebarNav}>
          {[
            { id: 'products', icon: <FaBoxOpen />, label: 'Products' },
            { id: 'stats', icon: <FaChartBar />, label: 'Analytics' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{ ...styles.sidebarLink, ...(activeTab === item.id ? styles.sidebarLinkActive : {}) }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}

        </nav>

        <div style={styles.sidebarBottom}>
          <a href="/" style={styles.sidebarBackBtn}>
            ← Back to Site
          </a>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────── */}
      <div className="adm-main" style={styles.mainArea}>

        {/* Topbar */}
        <div className="adm-topbar" style={styles.topbar}>
          <div>
            <h1 style={styles.topbarTitle}>
              {activeTab === 'products' ? 'Product Management' : 'Store Analytics'}
            </h1>
            <p style={styles.topbarSub}>
              {activeTab === 'products'
                ? `${products.length} products · ${stats.soldOut} sold out`
                : 'Overview of your store performance'}
            </p>
          </div>
          {activeTab === 'products' && (
            <button onClick={openAdd} className="adm-add-btn" style={styles.addBtn}>
              ＋ Add Product
            </button>
          )}
        </div>

        {/* Toast */}
        {msg && (
          <div style={{ ...styles.toast, ...(msg.type === 'success' ? styles.toastSuccess : styles.toastError) }}>
            {msg.type === 'success' ? '✓' : '✕'} {msg.text}
          </div>
        )}

        {/* ── PRODUCTS TAB ──────────────────────────────────────── */}
        {activeTab === 'products' && (
          <div className="adm-tab-content" style={styles.tabContent}>
            {/* Quick stats bar */}
            <div className="adm-quick-stats" style={styles.quickStats}>
              {[
                { label: 'Total Products', value: stats.total, color: '#3b82f6' },
                { label: 'Available', value: stats.available, color: '#22c55e' },
                { label: 'Sold Out', value: stats.soldOut, color: '#ef4444' },
                { label: 'Total Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, color: '#c8a96e' },
              ].map(s => (
                <div key={s.label} style={styles.quickStat}>
                  <div style={{ ...styles.quickStatValue, color: s.color }}>{s.value}</div>
                  <div style={styles.quickStatLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Filter / Search toolbar */}
            <div className="adm-toolbar" style={styles.toolbar}>
              <div className="adm-toolbar-left" style={styles.toolbarLeft}>
                {/* Search */}
                <div className="adm-search-wrap" style={styles.searchWrap}>
                  <span style={styles.searchIcon}><FaSearch /></span>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search products…"
                    style={styles.searchInput}
                  />
                  {search && (
                    <button onClick={() => setSearch('')} style={styles.clearBtn}>✕</button>
                  )}
                </div>

                {/* Category filter */}
                <select
                  className="adm-cat-select"
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  style={styles.catSelect}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{CAT_ICONS[c]} {c} ({products.filter(p => p.category === c).length})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>{filtered.length} results</span>
                {/* View toggle */}
                <button
                  onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')}
                  style={styles.viewToggleBtn}
                  title={viewMode === 'grid' ? 'Switch to table view' : 'Switch to grid view'}
                >
                  {viewMode === 'grid' ? <><FaTable style={{ marginRight: '0.3rem' }} />Table</> : <><FaTh style={{ marginRight: '0.3rem' }} />Grid</>}
                </button>
              </div>
            </div>

            {/* Product list */}
            {loading && products.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}><FaSpinner /></div>
                <p>Loading products…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={styles.emptyBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}><FaInbox /></div>
                <p style={{ marginBottom: '1rem' }}>
                  {search || catFilter !== 'All' ? 'No products match your filters.' : 'No products yet. Add your first product!'}
                </p>
                {(search || catFilter !== 'All') && (
                  <button onClick={() => { setSearch(''); setCatFilter('All') }} style={styles.clearFilterBtn}>
                    Clear Filters
                  </button>
                )}
                <button onClick={openAdd} style={{ ...styles.addBtn, marginTop: '0.75rem' }}>
                  ＋ Add Product
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <GridView products={filtered} onEdit={openEdit} onDelete={setConfirmDel} confirmDel={confirmDel} onConfirmDelete={handleDelete} />
            ) : (
              <TableView products={filtered} onEdit={openEdit} onDelete={setConfirmDel} confirmDel={confirmDel} onConfirmDelete={handleDelete} />
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <div style={styles.tabContent}>
            {/* Big stats */}
            <div style={styles.statsGrid}>
              {[
                { icon: <FaBoxOpen />, label: 'Total Products', value: stats.total, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
                { icon: <FaCheckCircle />, label: 'Available Stock', value: stats.available, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
                { icon: <FaTimesCircle />, label: 'Sold Out', value: stats.soldOut, bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
                { icon: <FaMoneyBillWave />, label: 'Catalogue Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
              ].map(s => (
                <div key={s.label} style={{ ...styles.bigStatCard, background: s.bg, borderColor: s.border }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: s.color }}>{s.icon}</div>
                  <div style={{ ...styles.bigStatValue, color: s.color }}>{s.value}</div>
                  <div style={styles.bigStatLabel}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Category breakdown */}
            <div style={styles.catBreakdownCard}>
              <h3 style={styles.sectionHeading}>Products by Category</h3>
              <div style={styles.catBreakdownList}>
                {stats.byCat.map(({ cat, count }) => {
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={cat} style={styles.catBreakdownRow}>
                      <div style={styles.catBreakdownLeft}>
                        <span style={{ fontSize: '1.1rem' }}>{CAT_ICONS[cat]}</span>
                        <span style={styles.catBreakdownName}>{cat}</span>
                      </div>
                      <div style={styles.catBreakdownRight}>
                        <div style={styles.barTrack}>
                          <div style={{ ...styles.barFill, width: `${pct}%` }} />
                        </div>
                        <span style={styles.catBreakdownCount}>{count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sold out section */}
            {stats.soldOut > 0 && (
              <div style={styles.soldOutCard}>
                <h3 style={styles.sectionHeading}><FaExclamationTriangle style={{ marginRight: '0.4rem', color: '#f59e0b' }} />Sold Out Items ({stats.soldOut})</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
                  {products.filter(p => p.soldOut).map(p => (
                    <div key={p.id} style={styles.soldOutChip}>
                      <span>{p.name}</span>
                      <button
                        onClick={() => openEdit(p)}
                        style={styles.chipEditBtn}
                        title="Edit"
                      ><FaEdit /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Delete confirm dialog ────────────────────────────────── */}
      {confirmDel && (
        <div style={styles.modalOverlay}>
          <div style={styles.confirmCard}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#ef4444' }}><FaTrash /></div>
            <h3 style={{ fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>Delete Product?</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              "{products.find(p => p.id === confirmDel)?.name}" will be permanently removed from your store.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDel(null)} style={styles.cancelBtn}>Cancel</button>
              <button
                onClick={() => handleDelete(confirmDel)}
                disabled={loading}
                style={{ ...styles.submitBtn, background: '#ef4444', borderColor: '#ef4444' }}
              >
                {loading ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Product Form Modal ───────────────────────────────────── */}
      {showModal && (
        <ProductModal
          form={form}
          editing={editing}
          loading={loading}
          onClose={() => { setShowModal(false); setEditing(null); setForm(EMPTY_FORM) }}
          onChange={handleFormChange}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GRID VIEW
══════════════════════════════════════════════════════════════════════════ */
function GridView({ products, onEdit, onDelete, confirmDel, onConfirmDelete }) {
  return (
    <div style={styles.gridView}>
      {products.map(p => (
        <div key={p.id} style={styles.gridCard}>
          <div style={styles.gridCardImg}>
            {p.images?.[0]
              ? <img src={p.images[0]} alt={p.name} style={styles.gridImg} />
              : <div style={styles.gridImgPlaceholder}>No Image</div>
            }
            {p.soldOut && <div style={styles.soldOutBadge}>Sold Out</div>}
            <div style={styles.gridCardOverlay}>
              <button onClick={() => onEdit(p)} style={styles.overlayBtn}><FaEdit style={{ marginRight: '0.3rem' }} />Edit</button>
            </div>
          </div>
          <div style={styles.gridCardBody}>
            <div style={styles.gridCardCat}><span style={{ marginRight: '0.3rem', display: 'inline-flex', verticalAlign: 'middle' }}>{CAT_ICONS[p.category]}</span>{p.category}</div>
            <div style={styles.gridCardName}>{p.name}</div>
            <div style={styles.gridCardPrice}>₹{p.price?.toLocaleString('en-IN')}</div>
            {p.fabric && <div style={styles.gridCardFabric}><GiSewingNeedle style={{ marginRight: '0.3rem' }} />{p.fabric}</div>}
          </div>
          <div style={styles.gridCardFooter}>
            <button onClick={() => onEdit(p)} style={styles.editBtnSm}><FaEdit style={{ marginRight: '0.3rem' }} />Edit</button>
            <button onClick={() => onDelete(p.id)} style={styles.delBtnSm}><FaTrash style={{ marginRight: '0.3rem' }} />Delete</button>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TABLE VIEW
══════════════════════════════════════════════════════════════════════════ */
function TableView({ products, onEdit, onDelete }) {
  return (
    <div style={styles.tableWrap}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Product</th>
            <th style={styles.th}>Category</th>
            <th style={styles.th}>Price</th>
            <th style={styles.th}>Fabric</th>
            <th style={styles.th}>Status</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr key={p.id} style={{ ...styles.tr, background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
              <td style={styles.td}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.name} style={styles.tableThumb} />
                    : <div style={styles.tableThumbPlaceholder}>?</div>
                  }
                  <div>
                    <div style={styles.tableName}>{p.name}</div>
                    {p.description && (
                      <div style={styles.tableDesc}>
                        {p.description.slice(0, 55)}{p.description.length > 55 ? '…' : ''}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td style={styles.td}>
                <span style={styles.catChip}><span style={{ marginRight: '0.3rem', display: 'inline-flex', verticalAlign: 'middle' }}>{CAT_ICONS[p.category]}</span>{p.category}</span>
              </td>
              <td style={{ ...styles.td, fontWeight: 700 }}>₹{p.price?.toLocaleString('en-IN')}</td>
              <td style={{ ...styles.td, color: '#888', fontSize: '0.82rem' }}>{p.fabric || '—'}</td>
              <td style={styles.td}>
                <span style={p.soldOut ? styles.badgeSoldOut : styles.badgeAvail}>
                  {p.soldOut ? 'Sold Out' : 'Available'}
                </span>
              </td>
              <td style={{ ...styles.td, textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                  <button onClick={() => onEdit(p)} style={styles.tableEditBtn}><FaEdit /></button>
                  <button onClick={() => onDelete(p.id)} style={styles.tableDelBtn}><FaTrash /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   INLINE STYLES (scoped – no global CSS pollution)
══════════════════════════════════════════════════════════════════════════ */
const styles = {
  /* Login */
  loginBg: {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #0e0e0e 0%, #1a1628 100%)',
    padding: '2rem',
  },
  loginCard: {
    background: '#fff', borderRadius: 20, padding: '3rem 2.5rem',
    width: '100%', maxWidth: 420, textAlign: 'center',
    boxShadow: '0 30px 90px rgba(0,0,0,0.4)',
  },
  loginLogo: {
    width: 68, height: 68, background: '#0e0e0e', borderRadius: '50%',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: '1.25rem',
  },
  loginBrand: { fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', fontWeight: 600, marginBottom: '0.5rem' },
  loginTitle: { fontFamily: 'Georgia, serif', fontSize: '1.8rem', margin: '0 0 0.4rem' },
  loginSub: { color: '#888', fontSize: '0.88rem', margin: '0 0 2rem' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  pwdWrap: { position: 'relative' },
  pwdInput: {
    width: '100%', padding: '0.85rem 3rem 0.85rem 1rem', borderRadius: 10,
    border: '1.5px solid #ddd', fontSize: '1rem', outline: 'none',
    fontFamily: 'inherit', transition: 'border 0.2s', boxSizing: 'border-box',
  },
  pwdInputErr: { borderColor: '#e53e3e' },
  eyeBtn: {
    position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem',
  },
  errText: { color: '#e53e3e', fontSize: '0.82rem', margin: 0, textAlign: 'left' },
  loginBtn: {
    padding: '0.85rem', background: '#0e0e0e', color: '#fff', border: 'none',
    borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
    letterSpacing: '0.04em', transition: 'background 0.2s',
  },

  /* Dashboard shell */
  dashRoot: { display: 'flex', minHeight: '100vh', background: '#f5f4f0', fontFamily: '"Inter", system-ui, sans-serif' },

  /* Sidebar */
  sidebar: {
    width: 220, background: '#0e0e0e', display: 'flex', flexDirection: 'column',
    position: 'sticky', top: 0, height: '100vh', flexShrink: 0,
  },
  sidebarBrand: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  sidebarBrandIcon: {
    width: 36, height: 36, background: '#c8a96e', borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif', fontWeight: 700, color: '#fff', fontSize: '1.1rem',
  },
  sidebarBrandName: { color: '#fff', fontWeight: 700, fontSize: '0.9rem' },
  sidebarBrandSub: { color: '#c8a96e', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' },
  sidebarNav: { flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  sidebarLink: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.7rem 0.9rem', borderRadius: 8,
    background: 'none', border: 'none', cursor: 'pointer',
    color: 'rgba(255,255,255,0.55)', fontSize: '0.87rem', fontWeight: 500,
    width: '100%', textAlign: 'left', transition: 'all 0.2s',
  },
  sidebarLinkActive: { background: 'rgba(200,169,110,0.15)', color: '#c8a96e' },
  sidebarBottom: { padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' },
  sidebarBackBtn: {
    display: 'block', padding: '0.65rem 0.9rem', borderRadius: 8,
    background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)',
    fontSize: '0.82rem', textDecoration: 'none', textAlign: 'center',
    transition: 'all 0.2s',
  },

  /* Main */
  mainArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' },
  topbar: {
    background: '#fff', borderBottom: '1px solid #e0ddd8',
    padding: '1.25rem 2rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
    position: 'sticky', top: 0, zIndex: 10,
  },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', margin: 0 },
  topbarSub: { fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0' },
  addBtn: {
    padding: '0.65rem 1.4rem', background: '#0e0e0e', color: '#fff',
    border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', letterSpacing: '0.04em', transition: 'background 0.2s',
    whiteSpace: 'nowrap',
  },

  /* Toast */
  toast: {
    position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)',
    padding: '0.75rem 1.5rem', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem',
    zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
    animation: 'none', whiteSpace: 'nowrap',
  },
  toastSuccess: { background: '#064e3b', color: '#6ee7b7' },
  toastError: { background: '#7f1d1d', color: '#fca5a5' },

  /* Tab content */
  tabContent: { padding: '2rem', flex: 1 },

  /* Quick stats bar */
  quickStats: {
    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem',
  },
  quickStat: {
    background: '#fff', borderRadius: 10, padding: '1.1rem 1.25rem',
    border: '1px solid #e0ddd8', textAlign: 'center',
  },
  quickStatValue: { fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Georgia,serif' },
  quickStatLabel: { fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' },

  /* Toolbar */
  toolbar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap',
  },
  toolbarLeft: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 },
  searchWrap: {
    position: 'relative', flex: 1, minWidth: 180, maxWidth: 320,
  },
  searchIcon: {
    position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)',
    fontSize: '0.85rem', pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '0.6rem 2.2rem 0.6rem 2.4rem',
    border: '1.5px solid #e0ddd8', borderRadius: 8, fontSize: '0.85rem',
    outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  clearBtn: {
    position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.8rem',
  },
  catSelect: {
    padding: '0.6rem 0.9rem', border: '1.5px solid #e0ddd8', borderRadius: 8,
    fontSize: '0.84rem', outline: 'none', background: '#fff', cursor: 'pointer',
    fontFamily: 'inherit',
  },
  viewToggleBtn: {
    padding: '0.55rem 1rem', background: '#fff', border: '1.5px solid #e0ddd8',
    borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer',
  },

  /* Grid View */
  gridView: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '1.25rem',
  },
  gridCard: {
    background: '#fff', borderRadius: 12, overflow: 'hidden',
    border: '1px solid #e0ddd8',
    transition: 'box-shadow 0.25s, transform 0.25s',
    display: 'flex', flexDirection: 'column',
  },
  gridCardImg: { position: 'relative', aspectRatio: '3/4', background: '#f0eeea', overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%', objectFit: 'cover' },
  gridImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', fontSize: '0.75rem' },
  soldOutBadge: {
    position: 'absolute', top: 8, left: 8,
    background: 'rgba(239,68,68,0.9)', color: '#fff',
    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '3px 8px', borderRadius: 4,
  },
  gridCardOverlay: {
    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: 0, transition: 'opacity 0.2s',
  },
  overlayBtn: {
    background: '#fff', border: 'none', borderRadius: 8,
    padding: '0.5rem 1.1rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
  },
  gridCardBody: { padding: '0.9rem 1rem 0.5rem', flex: 1 },
  gridCardCat: { fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' },
  gridCardName: { fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gridCardPrice: { fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700, color: '#0e0e0e' },
  gridCardFabric: { fontSize: '0.72rem', color: '#aaa', marginTop: '0.3rem' },
  gridCardFooter: { display: 'flex', gap: '0', borderTop: '1px solid #f0eeea' },
  editBtnSm: { flex: 1, padding: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#3b82f6', transition: 'background 0.15s', borderRight: '1px solid #f0eeea' },
  delBtnSm: { flex: 1, padding: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#ef4444', transition: 'background 0.15s' },

  /* Table View */
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f7f4' },
  th: { padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', textAlign: 'left', borderBottom: '1px solid #e0ddd8' },
  tr: { borderBottom: '1px solid #f0eeea', transition: 'background 0.15s' },
  td: { padding: '0.9rem 1rem', fontSize: '0.87rem', verticalAlign: 'middle' },
  tableThumb: { width: 52, height: 68, objectFit: 'cover', borderRadius: 6, flexShrink: 0 },
  tableThumbPlaceholder: { width: 52, height: 68, background: '#f0eeea', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexShrink: 0 },
  tableName: { fontWeight: 600, fontSize: '0.88rem' },
  tableDesc: { fontSize: '0.76rem', color: '#aaa', marginTop: '0.2rem' },
  catChip: { background: '#f5f4f0', border: '1px solid #e0ddd8', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' },
  badgeAvail: { background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20 },
  badgeSoldOut: { background: '#fee2e2', color: '#b91c1c', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20 },
  tableEditBtn: { width: 34, height: 34, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' },
  tableDelBtn: { width: 34, height: 34, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' },

  /* Empty box */
  emptyBox: { background: '#fff', borderRadius: 12, padding: '4rem 2rem', textAlign: 'center', color: '#888', border: '1px solid #e0ddd8' },
  clearFilterBtn: { padding: '0.5rem 1.2rem', background: '#f5f4f0', border: '1.5px solid #e0ddd8', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' },

  /* Analytics (Stats tab) */
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1.25rem', marginBottom: '1.5rem' },
  bigStatCard: { borderRadius: 12, padding: '1.75rem', border: '1.5px solid', textAlign: 'center' },
  bigStatValue: { fontFamily: 'Georgia,serif', fontSize: '2rem', fontWeight: 700 },
  bigStatLabel: { fontSize: '0.78rem', color: '#888', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  catBreakdownCard: { background: '#fff', borderRadius: 12, padding: '1.75rem', border: '1px solid #e0ddd8', marginBottom: '1.25rem' },
  sectionHeading: { fontFamily: 'Georgia,serif', fontSize: '1.1rem', marginBottom: '1.25rem' },
  catBreakdownList: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  catBreakdownRow: { display: 'flex', alignItems: 'center', gap: '1rem' },
  catBreakdownLeft: { display: 'flex', gap: '0.5rem', alignItems: 'center', width: 200, flexShrink: 0 },
  catBreakdownName: { fontSize: '0.85rem', fontWeight: 500 },
  catBreakdownRight: { display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 },
  barTrack: { flex: 1, height: 8, background: '#f0eeea', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', background: 'linear-gradient(90deg,#c8a96e,#a8894e)', borderRadius: 4, transition: 'width 0.5s ease', minWidth: 4 },
  catBreakdownCount: { fontSize: '0.82rem', fontWeight: 600, width: 24, textAlign: 'right' },
  soldOutCard: { background: '#fff', borderRadius: 12, padding: '1.75rem', border: '1px solid #fecaca' },
  soldOutChip: {
    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20,
    padding: '0.3rem 0.7rem 0.3rem 0.9rem', fontSize: '0.82rem',
  },
  chipEditBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem' },

  /* Modal */
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1.5rem',
    backdropFilter: 'blur(4px)',
  },
  modalCard: {
    background: '#fff', borderRadius: 16, width: '100%', maxWidth: 640,
    maxHeight: '90vh', overflow: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.3)',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '1.25rem 1.5rem', borderBottom: '1px solid #e0ddd8',
    position: 'sticky', top: 0, background: '#fff', zIndex: 1, borderRadius: '16px 16px 0 0',
  },
  modalTitle: { fontFamily: 'Georgia,serif', fontSize: '1.2rem', margin: 0 },
  modalCloseBtn: { background: '#f5f4f0', border: 'none', borderRadius: 8, width: 34, height: 34, cursor: 'pointer', fontSize: '0.9rem' },
  modalForm: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' },
  modalFooter: { display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '0.5rem', borderTop: '1px solid #f0eeea', marginTop: '0.5rem' },

  /* Confirm delete card */
  confirmCard: {
    background: '#fff', borderRadius: 16, padding: '2.5rem',
    textAlign: 'center', maxWidth: 380, width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },

  /* Form fields */
  formRow2: { display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.75rem' },
  formField: { display: 'flex', flexDirection: 'column', gap: '0.4rem', flex: 1 },
  label: { fontSize: '0.75rem', fontWeight: 600, color: '#555', textTransform: 'uppercase', letterSpacing: '0.06em' },
  labelHint: { textTransform: 'none', fontWeight: 400, color: '#aaa', letterSpacing: 0 },
  input: {
    padding: '0.65rem 0.9rem', border: '1.5px solid #e2e2e2', borderRadius: 8,
    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', background: '#fafafa',
    transition: 'border 0.2s', width: '100%', boxSizing: 'border-box',
  },
  imgPreviewRow: { display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' },
  imgPreviewBox: { width: 68, height: 90, borderRadius: 6, overflow: 'hidden', border: '1.5px solid #e2e2e2', background: '#f0eeea' },
  imgPreviewImg: { width: '100%', height: '100%', objectFit: 'cover' },
  toggleRow: { display: 'flex', gap: '0.85rem', alignItems: 'center', cursor: 'pointer' },
  toggleTrack: { width: 44, height: 24, borderRadius: 12, position: 'relative', cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0 },
  toggleThumb: { width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },

  /* Buttons */
  cancelBtn: {
    padding: '0.65rem 1.3rem', background: '#f5f4f0', border: '1.5px solid #e0ddd8',
    borderRadius: 8, fontSize: '0.87rem', fontWeight: 500, cursor: 'pointer',
  },
  submitBtn: {
    padding: '0.65rem 1.75rem', background: '#0e0e0e', color: '#fff',
    border: '2px solid #0e0e0e', borderRadius: 8, fontSize: '0.87rem', fontWeight: 600,
    cursor: 'pointer', letterSpacing: '0.03em',
  },
}
