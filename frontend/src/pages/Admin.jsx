import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  getAllProducts, verifyOwner, addProduct,
  updateProduct, deleteProduct, uploadImages,
  requestOTP, verifyOTP, resetPassword,
} from '../lib/productStore'
import ImageUploader from '../components/ImageUploader'
import {
  FaSearch, FaEdit, FaTrash, FaBoxOpen, FaChartBar, FaEye, FaEyeSlash,
  FaTrophy, FaCheckCircle, FaTimesCircle, FaMoneyBillWave, FaSpinner,
  FaInbox, FaExclamationTriangle, FaTable, FaTh, FaTimes, FaPlus,
  FaArrowLeft, FaStar, FaTag, FaImage, FaFire,
} from 'react-icons/fa'
import {
  GiShirt, GiArmoredPants, GiTShirt, GiTie, GiClothes, GiBelt,
  GiRunningShoe, GiWatch, GiUnderwear, GiSuitcase, GiSewingNeedle,
} from 'react-icons/gi'
import { MdOutlineCheckroom } from 'react-icons/md'

/* ── Constants ──────────────────────────────────────────────────────────── */
const CATEGORIES = [
  'Shirts', 'Pants', 'Formal Shirts & Pants Sets',
  'Shirt & Pant Sets', 'T-Shirt or Pant Sets',
  'Belts', 'Branded Shoes', 'Watches', 'Accessories',
]

const ALL_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size']

const SHOE_SIZES = ['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10', 'UK 11']
const WATCH_SIZES = ['Free Size']

const EMPTY_FORM = {
  name: '', category: 'Shirts', subcategory: '', brand: 'Aryan Designer Studio',
  sku: '', status: 'active',
  price: '', discountPrice: '',
  stock: '',
  description: '',
  sizes: [], colors: [], tags: [],
  featured: false, newArrival: false, bestSeller: false,
  fabric: '',
  images: [],        // final URL array (after upload)
  _stagedFiles: [],  // staged File objects before upload
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
/* ══════════════════════════════════════════════════════════════════════════
   FORGOT PASSWORD MODAL  (3-step: Send OTP → Verify OTP → New Password)
══════════════════════════════════════════════════════════════════════════ */
function ForgotPasswordModal({ onClose, onPasswordReset }) {
  const OFFICIAL_EMAIL = 'aryandesignerstudio7@gmail.com'
  const OTP_EXPIRY_SEC = 600  // 10 min

  const [step, setStep] = useState(1)  // 1=send, 2=enter otp, 3=new pwd
  const [token, setToken] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [success, setSuccess] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devMode, setDevMode] = useState(false)
  const otpRefs = useRef([])
  const timerRef = useRef(null)

  // Countdown timer
  function startCountdown(sec) {
    setCountdown(sec)
    clearInterval(timerRef.current)
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  useEffect(() => () => clearInterval(timerRef.current), [])

  function fmtTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }

  // STEP 1 — Send OTP
  async function handleSendOTP() {
    setErr(''); setLoading(true)
    try {
      const res = await requestOTP()
      setToken(res.token)
      setDevMode(!!res.dev)
      setStep(2)
      startCountdown(OTP_EXPIRY_SEC)
      setSuccess(res.dev
        ? '⚠ Gmail not configured — OTP printed to backend console'
        : `OTP sent to ${OFFICIAL_EMAIL}`)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // STEP 2 — Verify OTP
  async function handleVerifyOTP() {
    const otpStr = otp.join('')
    if (otpStr.length < 6) { setErr('Enter all 6 digits.'); return }
    setErr(''); setLoading(true)
    try {
      const res = await verifyOTP(token, otpStr)
      setResetToken(res.resetToken)
      clearInterval(timerRef.current)
      setStep(3)
      setSuccess('')
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // STEP 3 — Reset Password
  async function handleReset() {
    if (!newPwd) { setErr('Enter a new password.'); return }
    if (newPwd.length < 6) { setErr('Password must be at least 6 characters.'); return }
    if (newPwd !== confirmPwd) { setErr('Passwords do not match.'); return }
    setErr(''); setLoading(true)
    try {
      await resetPassword(resetToken, newPwd)
      setSuccess('Password changed! You can now log in.')
      setTimeout(() => { onPasswordReset(); onClose() }, 1800)
    } catch (e) {
      setErr(e.message)
    } finally {
      setLoading(false)
    }
  }

  // OTP digit box handler
  function handleOtpChange(idx, val) {
    const v = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]; next[idx] = v; setOtp(next)
    setErr('')
    if (v && idx < 5) otpRefs.current[idx + 1]?.focus()
  }
  function handleOtpKey(idx, e) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus()
    }
  }
  function handleOtpPaste(e) {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (text.length === 6) {
      setOtp(text.split(''))
      otpRefs.current[5]?.focus()
      e.preventDefault()
    }
  }

  return (
    <div style={s.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...s.confirmCard, maxWidth: 420, textAlign: 'left', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#c8a96e', fontWeight: 600, marginBottom: '0.2rem' }}>Owner Portal</div>
            <h2 style={{ fontFamily: 'Georgia,serif', fontSize: '1.3rem', margin: 0 }}>Forgot Password</h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#aaa' }}>✕</button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.75rem' }}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: n <= step ? '#0e0e0e' : '#e0ddd8',
              transition: 'background 0.3s'
            }} />
          ))}
        </div>

        {/* ─── STEP 1: Confirm email ─────────────────────── */}
        {step === 1 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📧</div>
              <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>
                An OTP will be sent to your official business email:
              </p>
              <div style={{ marginTop: '0.75rem', background: '#f5f4f0', borderRadius: 8, padding: '0.65rem 1rem', display: 'inline-block', fontWeight: 700, fontSize: '0.88rem', color: '#0e0e0e' }}>
                {OFFICIAL_EMAIL}
              </div>
            </div>
            {err && <p style={{ ...s.errText, textAlign: 'center', marginBottom: '1rem' }}>{err}</p>}
            <button onClick={handleSendOTP} disabled={loading} style={{ ...s.loginBtn, width: '100%' }}>
              {loading ? 'Sending OTP…' : '📨 Send OTP to Email'}
            </button>
            <button onClick={onClose} style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', marginTop: '0.65rem', padding: '0.5rem', cursor: 'pointer', fontSize: '0.82rem' }}>Cancel</button>
          </>
        )}

        {/* ─── STEP 2: Enter OTP ────────────────────────── */}
        {step === 2 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔢</div>
              <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.7, margin: '0 0 0.5rem' }}>
                {devMode
                  ? 'Gmail not configured — check your backend console for the OTP.'
                  : <>Enter the 6-digit OTP sent to <strong>{OFFICIAL_EMAIL}</strong></>}
              </p>
              {countdown > 0 && (
                <div style={{ fontSize: '0.78rem', color: countdown < 60 ? '#e53e3e' : '#888' }}>
                  Expires in {fmtTime(countdown)}
                </div>
              )}
              {countdown === 0 && (
                <div style={{ fontSize: '0.78rem', color: '#e53e3e' }}>OTP expired. <button style={{ background: 'none', border: 'none', color: '#0e0e0e', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.78rem' }} onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setErr(''); setSuccess('') }}>Resend</button></div>
              )}
            </div>

            {success && <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.8rem', color: '#15803d', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}

            {/* OTP digit boxes */}
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.25rem' }} onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={el => otpRefs.current[idx] = el}
                  type="text" inputMode="numeric" maxLength={1}
                  value={digit}
                  onChange={e => handleOtpChange(idx, e.target.value)}
                  onKeyDown={e => handleOtpKey(idx, e)}
                  style={{
                    width: 52, height: 60, textAlign: 'center', fontSize: '1.6rem', fontWeight: 700,
                    border: `2px solid ${digit ? '#0e0e0e' : '#e0ddd8'}`,
                    borderRadius: 10, outline: 'none', background: '#fafafa',
                    fontFamily: 'monospace', transition: 'border-color 0.15s'
                  }}
                />
              ))}
            </div>

            {err && <p style={{ ...s.errText, textAlign: 'center', marginBottom: '0.75rem' }}>{err}</p>}
            <button onClick={handleVerifyOTP} disabled={loading || countdown === 0} style={{ ...s.loginBtn, width: '100%' }}>
              {loading ? 'Verifying…' : 'Verify OTP →'}
            </button>
            <button onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); setErr(''); setSuccess('') }}
              style={{ width: '100%', background: 'none', border: 'none', color: '#aaa', marginTop: '0.65rem', padding: '0.5rem', cursor: 'pointer', fontSize: '0.82rem' }}>
              ← Go back
            </button>
          </>
        )}

        {/* ─── STEP 3: New Password ─────────────────────── */}
        {step === 3 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔐</div>
              <p style={{ color: '#555', fontSize: '0.88rem', lineHeight: 1.7, margin: 0 }}>Identity verified! Set your new admin password.</p>
            </div>

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.88rem', color: '#15803d', marginBottom: '1rem', textAlign: 'center', fontWeight: 600 }}>
                ✓ {success}
              </div>
            )}

            {!success && (
              <>
                <div style={s.field}>
                  <label style={s.label}>New Password</label>
                  <div style={s.pwdWrap}>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={newPwd}
                      onChange={e => { setNewPwd(e.target.value); setErr('') }}
                      placeholder="Min. 6 characters"
                      style={{ ...s.pwdInput, ...(err ? s.pwdInputErr : {}) }}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} style={s.eyeBtn}>
                      {showPwd ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                <div style={{ ...s.field, marginTop: '0.75rem' }}>
                  <label style={s.label}>Confirm Password</label>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={confirmPwd}
                    onChange={e => { setConfirmPwd(e.target.value); setErr('') }}
                    placeholder="Re-enter password"
                    style={{ ...s.pwdInput, ...(err ? s.pwdInputErr : {}), boxSizing: 'border-box' }}
                  />
                </div>
                {err && <p style={{ ...s.errText, marginTop: '0.5rem' }}>{err}</p>}

                {/* Password strength bar */}
                {newPwd && (() => {
                  const score = [newPwd.length >= 8, /[A-Z]/.test(newPwd), /[0-9]/.test(newPwd), /[^\w]/.test(newPwd)].filter(Boolean).length
                  const colors = ['#ef4444', '#f59e0b', '#22c55e', '#22c55e']
                  const labels = ['Weak', 'Fair', 'Good', 'Strong']
                  return (
                    <div style={{ marginTop: '0.75rem' }}>
                      <div style={{ display: 'flex', gap: '3px', marginBottom: '0.3rem' }}>
                        {[1, 2, 3, 4].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score - 1] : '#e0ddd8', transition: 'background 0.2s' }} />)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: colors[score - 1] }}>{labels[score - 1]}</div>
                    </div>
                  )
                })()}

                <button onClick={handleReset} disabled={loading} style={{ ...s.loginBtn, width: '100%', marginTop: '1.5rem' }}>
                  {loading ? 'Saving…' : '✓ Set New Password'}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [pwd, setPwd] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [showForgot, setShowForgot] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setErr(''); setLoading(true)
    const ok = await verifyOwner(pwd)
    setLoading(false)
    if (ok) onLogin(pwd)
    else { setErr('Incorrect password. Try again.'); setPwd('') }
  }

  return (
    <div style={s.loginBg}>
      {showForgot && (
        <ForgotPasswordModal
          onClose={() => setShowForgot(false)}
          onPasswordReset={() => { setShowForgot(false); setErr(''); setPwd('') }}
        />
      )}
      <div style={s.loginCard}>
        <div style={s.loginLogo}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c8a96e" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
        </div>
        <div style={s.loginBrand}>Aryan Designer Studio</div>
        <h1 style={s.loginTitle}>Owner Dashboard</h1>
        <p style={s.loginSub}>Enter your owner password to manage the store</p>

        <form onSubmit={handleSubmit} style={s.loginForm}>
          <div style={s.pwdWrap}>
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="Owner password"
              autoFocus
              style={{ ...s.pwdInput, ...(err ? s.pwdInputErr : {}) }}
            />
            <button type="button" onClick={() => setShow(v => !v)} style={s.eyeBtn}>
              {show ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {err && <p style={s.errText}>{err}</p>}
          <button type="submit" disabled={loading || !pwd} style={s.loginBtn}>
            {loading ? '…' : 'Enter Dashboard →'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => setShowForgot(true)}
          style={s.forgotBtn}
        >
          Forgot password?
        </button>

        <p style={{ fontSize: '0.75rem', color: '#999', marginTop: '1rem' }}>
          Aryan Designer Studio · Owner Access Only
        </p>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TAG INPUT  — shared for colors, tags
══════════════════════════════════════════════════════════════════════════ */
function TagInput({ values = [], onChange, placeholder, suggestions = [] }) {
  const [input, setInput] = useState('')

  function add(val) {
    const v = val.trim()
    if (!v || values.includes(v)) { setInput(''); return }
    onChange([...values, v])
    setInput('')
  }

  function remove(idx) {
    onChange(values.filter((_, i) => i !== idx))
  }

  return (
    <div style={s.tagRoot}>
      <div style={s.tagPills}>
        {values.map((v, i) => (
          <span key={i} style={s.tagPill}>
            {v}
            <button type="button" onClick={() => remove(i)} style={s.tagRemove}>×</button>
          </span>
        ))}
        <input
          style={s.tagInput}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(input) }
            if (e.key === 'Backspace' && !input && values.length > 0) remove(values.length - 1)
          }}
          onBlur={() => input.trim() && add(input)}
          placeholder={values.length === 0 ? placeholder : ''}
        />
      </div>
      {suggestions.length > 0 && (
        <div style={s.tagSuggestions}>
          {suggestions.filter(sg => !values.includes(sg)).map(sg => (
            <button key={sg} type="button" style={s.tagSuggestionChip} onClick={() => add(sg)}>
              + {sg}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TOGGLE  (checkbox styled as a pill switch)
══════════════════════════════════════════════════════════════════════════ */
function Toggle({ checked, onChange, color = '#22c55e' }) {
  return (
    <div
      onClick={onChange}
      style={{
        ...s.toggleTrack,
        background: checked ? color : '#e0ddd8',
        cursor: 'pointer',
      }}
    >
      <div style={{ ...s.toggleThumb, left: checked ? 20 : 2 }} />
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SECTION CARD
══════════════════════════════════════════════════════════════════════════ */
function Section({ icon, title, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionHead}>
        <span style={s.sectionIcon}>{icon}</span>
        <span style={s.sectionTitle}>{title}</span>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ADD / EDIT PRODUCT PAGE
══════════════════════════════════════════════════════════════════════════ */
function ProductFormPage({ editing, initialData, ownerPwd, onSaved, onCancel, showMsg }) {
  const isEdit = !!editing
  const [form, setForm] = useState(() => {
    if (isEdit && initialData) {
      return {
        ...EMPTY_FORM,
        ...initialData,
        price: String(initialData.price || ''),
        discountPrice: initialData.discountPrice ? String(initialData.discountPrice) : '',
        stock: String(initialData.stock ?? ''),
        sizes: initialData.sizes || [],
        colors: initialData.colors || [],
        tags: initialData.tags || [],
        images: initialData.images || [],
        _stagedFiles: [],
      }
    }
    return { ...EMPTY_FORM }
  })

  // Image upload state
  const [uploadErr, setUploadErr] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [saving, setSaving] = useState(false)

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  function toggleSize(size) {
    set('sizes', form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size])
  }

  function toggleShoeSize(size) {
    set('sizes', form.sizes.includes(size)
      ? form.sizes.filter(s => s !== size)
      : [...form.sizes, size])
  }

  // Called by ImageUploader when user stages new files
  function handleStagedFiles(files) {
    setUploadErr(null)
    set('_stagedFiles', files)
  }

  // Called by ImageUploader when user removes an already-uploaded URL (edit mode)
  function handleRemoveUrl(index) {
    set('images', form.images.filter((_, i) => i !== index))
  }

  async function handleSubmit(status) {
    // Validation
    if (!form.name.trim()) { showMsg('error', 'Product name is required.'); return }
    if (!form.price) { showMsg('error', 'Price is required.'); return }

    const hasStagedFiles = form._stagedFiles.length > 0
    const hasExistingUrls = form.images.length > 0

    if (!hasStagedFiles && !hasExistingUrls) {
      showMsg('error', 'Please upload at least one product image.')
      return
    }

    setSaving(true)
    setUploadErr(null)

    let finalImageUrls = [...form.images]

    // Step 1: Upload staged files to Cloudinary
    if (hasStagedFiles) {
      setUploading(true)
      setUploadProgress(0)
      try {
        const result = await uploadImages(form._stagedFiles, ownerPwd, pct => setUploadProgress(pct))
        finalImageUrls = [...finalImageUrls, ...result.urls]
        setUploading(false)
      } catch (err) {
        setUploading(false)
        setSaving(false)
        setUploadErr(err.message)
        showMsg('error', 'Image upload failed. Product was NOT saved.')
        return
      }
    }

    // Step 2: Build product payload
    const payload = {
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory.trim(),
      brand: form.brand.trim() || 'Aryan Designer Studio',
      sku: form.sku.trim(),
      price: Number(form.price),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      stock: form.stock !== '' ? Number(form.stock) : 0,
      description: form.description.trim(),
      sizes: form.sizes,
      colors: form.colors,
      tags: form.tags,
      featured: form.featured,
      newArrival: form.newArrival,
      bestSeller: form.bestSeller,
      status,
      images: finalImageUrls,
      fabric: form.fabric.trim(),
    }

    // Step 3: Save to backend
    try {
      if (isEdit) {
        await updateProduct(editing, payload, ownerPwd)
        showMsg('success', `"${payload.name}" updated successfully!`)
      } else {
        await addProduct(payload, ownerPwd)
        showMsg('success', status === 'active'
          ? `"${payload.name}" published — now live on the storefront!`
          : `"${payload.name}" saved as draft.`)
      }
      onSaved()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setSaving(false)
    }
  }

  const disabled = saving || uploading

  return (
    <div style={s.formPage}>
      {/* Back button + title */}
      <div style={s.formPageHeader}>
        <button type="button" onClick={onCancel} style={s.backBtn} disabled={disabled}>
          <FaArrowLeft style={{ marginRight: '0.4rem' }} /> Back to Products
        </button>
        <div>
          <h2 style={s.formPageTitle}>{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
          <p style={s.formPageSub}>
            {isEdit
              ? `Editing: ${initialData?.name}`
              : 'Fill in the product details and upload images, then publish.'}
          </p>
        </div>
      </div>

      <div style={s.formLayout}>
        {/* ── LEFT COLUMN ───────────────────────────────── */}
        <div style={s.formLeft}>

          {/* Basic Info */}
          <Section icon={<FaTag />} title="Basic Information">
            <div style={s.formGrid2}>
              <div style={s.field}>
                <label style={s.label}>Product Name <span style={s.req}>*</span></label>
                <input name="name" value={form.name} onChange={handleChange}
                  placeholder="e.g. Classic White Shirt" style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Brand</label>
                <input name="brand" value={form.brand} onChange={handleChange}
                  placeholder="Aryan Designer Studio" style={s.input} />
              </div>
            </div>

            <div style={s.formGrid3}>
              <div style={s.field}>
                <label style={s.label}>Category</label>
                <select name="category" value={form.category} onChange={handleChange} style={s.input}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Subcategory</label>
                <input name="subcategory" value={form.subcategory} onChange={handleChange}
                  placeholder="e.g. Kurta, Blazer" style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>SKU</label>
                <input name="sku" value={form.sku} onChange={handleChange}
                  placeholder="ADS-001" style={s.input} />
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Status</label>
              <div style={s.statusRow}>
                {['active', 'draft'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => set('status', st)}
                    style={{
                      ...s.statusBtn,
                      ...(form.status === st
                        ? (st === 'active' ? s.statusBtnActive : s.statusBtnDraft)
                        : {}),
                    }}
                  >
                    {st === 'active' ? '● Active' : '○ Draft'}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          {/* Pricing */}
          <Section icon={<FaMoneyBillWave />} title="Pricing">
            <div style={s.formGrid2}>
              <div style={s.field}>
                <label style={s.label}>Price ₹ <span style={s.req}>*</span></label>
                <input name="price" type="number" min="0" value={form.price}
                  onChange={handleChange} placeholder="e.g. 1299" style={s.input} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Discount Price ₹</label>
                <input name="discountPrice" type="number" min="0" value={form.discountPrice}
                  onChange={handleChange} placeholder="e.g. 999 (optional)" style={s.input} />
              </div>
            </div>
            {form.discountPrice && Number(form.discountPrice) > 0 && Number(form.price) > 0 && (
              <div style={s.savingsBadge}>
                💰 Customer saves ₹{(Number(form.price) - Number(form.discountPrice)).toLocaleString('en-IN')}
                {' '}({Math.round(((Number(form.price) - Number(form.discountPrice)) / Number(form.price)) * 100)}% off)
              </div>
            )}
          </Section>

          {/* Inventory */}
          <Section icon={<FaBoxOpen />} title="Inventory">
            <div style={{ maxWidth: 200 }}>
              <label style={s.label}>Stock Quantity</label>
              <input name="stock" type="number" min="0" value={form.stock}
                onChange={handleChange} placeholder="e.g. 25" style={s.input} />
            </div>
            {form.stock !== '' && Number(form.stock) === 0 && (
              <div style={s.outOfStockNote}>
                ⚠ Stock is 0 — this product will show as <strong>Out of Stock</strong> on the storefront.
              </div>
            )}
          </Section>

          {/* Attributes */}
          <Section icon={<GiSewingNeedle />} title="Attributes">
            <div style={s.field}>
              <label style={s.label}>Sizes Available</label>
              <div style={s.sizePills}>
                {ALL_SIZES.map(sz => (
                  <button
                    key={sz} type="button"
                    onClick={() => toggleSize(sz)}
                    style={{
                      ...s.sizePill,
                      ...(form.sizes.includes(sz) ? s.sizePillActive : {}),
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>

              <div style={s.sizePills}>
                {SHOE_SIZES.map(sz => (
                  <button
                    key={sz} type="button"
                    onClick={() => toggleShoeSize(sz)}
                    style={{
                      ...s.sizePill,
                      ...(form.sizes.includes(sz) ? s.sizePillActive : {}),
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Colors Available</label>
              <TagInput
                values={form.colors}
                onChange={v => set('colors', v)}
                placeholder="Type a color and press Enter…"
                suggestions={['Black', 'White', 'Navy', 'Red', 'Gold', 'Beige', 'Green', 'Blue', 'Maroon']}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Tags</label>
              <TagInput
                values={form.tags}
                onChange={v => set('tags', v)}
                placeholder="Type a tag and press Enter…"
                suggestions={['Wedding', 'Formal', 'Casual', 'Premium', 'Ethnic', 'Summer', 'Party']}
              />
            </div>

            <div style={s.field}>
              <label style={s.label}>Fabric / Material</label>
              <input name="fabric" value={form.fabric} onChange={handleChange}
                placeholder="e.g. Pure Cotton, Silk Blend, Rayon" style={s.input} />
            </div>
          </Section>

          {/* Description */}
          <Section icon={<FaTag />} title="Description">
            <div style={s.field}>
              <textarea
                name="description" value={form.description} onChange={handleChange}
                placeholder="Describe the product — material, style, occasion, fit…"
                rows={5} style={{ ...s.input, resize: 'vertical', lineHeight: 1.7 }}
              />
            </div>
          </Section>
        </div>

        {/* ── RIGHT COLUMN ──────────────────────────────── */}
        <div style={s.formRight}>

          {/* Images */}
          <Section icon={<FaImage />} title="Product Images">
            <p style={s.imageSectionNote}>
              Upload 1–5 images. <strong>First image</strong> becomes the thumbnail shown in the shop.
              Images are automatically converted to WebP and stored on Cloudinary.
            </p>
            <ImageUploader
              files={form._stagedFiles}
              onFilesChange={handleStagedFiles}
              uploadedUrls={form.images}
              onRemoveUrl={handleRemoveUrl}
              uploading={uploading}
              uploadProgress={uploadProgress}
              error={uploadErr}
            />
          </Section>

          {/* Marketing */}
          <Section icon={<FaFire />} title="Marketing">
            {[
              { key: 'featured', label: 'Featured Product', sub: 'Shown in homepage featured section', color: '#c8a96e' },
              { key: 'newArrival', label: 'New Arrival', sub: 'Shows "New" badge on product card', color: '#3b82f6' },
              { key: 'bestSeller', label: 'Best Seller', sub: 'Shows "Best Seller" badge', color: '#f59e0b' },
            ].map(({ key, label, sub, color }) => (
              <label key={key} style={s.toggleRow}>
                <Toggle
                  checked={form[key]}
                  onChange={() => set(key, !form[key])}
                  color={color}
                />
                <div>
                  <div style={s.toggleLabel}>{label}</div>
                  <div style={s.toggleSub}>{sub}</div>
                </div>
              </label>
            ))}
          </Section>

          {/* Action buttons */}
          <div style={s.actionCard}>
            <div style={s.actionTitle}>
              {isEdit ? 'Save Changes' : 'Publish Product'}
            </div>
            <p style={s.actionSub}>
              {isEdit
                ? 'Update the product across all pages instantly.'
                : 'Once published, the product appears live on the storefront.'}
            </p>

            {isEdit ? (
              <button
                type="button"
                onClick={() => handleSubmit(form.status)}
                disabled={disabled}
                style={{ ...s.publishBtn, marginBottom: '0.65rem' }}
              >
                {saving ? <><FaSpinner style={{ marginRight: '0.5rem' }} />Saving…</> : '✓ Update Product'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleSubmit('active')}
                  disabled={disabled}
                  style={{ ...s.publishBtn, marginBottom: '0.65rem' }}
                >
                  {saving && form.status !== 'draft'
                    ? <><FaSpinner style={{ marginRight: '0.5rem' }} />Publishing…</>
                    : '🚀 Publish Product'}
                </button>
                <button
                  type="button"
                  onClick={() => handleSubmit('draft')}
                  disabled={disabled}
                  style={s.draftBtn}
                >
                  {saving ? 'Saving…' : 'Save as Draft'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onCancel}
              disabled={disabled}
              style={s.cancelFormBtn}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   GRID VIEW
══════════════════════════════════════════════════════════════════════════ */
function GridView({ products, onEdit, onDelete }) {
  return (
    <div className="adm-grid-view" style={s.gridView}>
      {products.map(p => {
        const thumb = p.thumbnail || p.images?.[0]
        const isActive = p.status === 'active'
        return (
          <div key={p.id} style={s.gridCard}>
            <div style={s.gridCardImg}>
              {thumb
                ? <img src={thumb} alt={p.name} style={s.gridImg} />
                : <div style={s.gridImgPlaceholder}><FaImage style={{ color: '#ccc', fontSize: '2rem' }} /></div>
              }
              <div style={{ ...s.statusDot, background: isActive ? '#22c55e' : '#f59e0b' }}
                title={isActive ? 'Active' : 'Draft'} />
              {p.stock === 0 && <div style={s.soldOutBadge}>Out of Stock</div>}
              {p.bestSeller && <div style={s.bestSellerBadge}><FaTrophy /> Best Seller</div>}
              <div style={s.gridCardOverlay}>
                <button onClick={() => onEdit(p)} style={s.overlayBtn}><FaEdit style={{ marginRight: '0.3rem' }} />Edit</button>
              </div>
            </div>
            <div style={s.gridCardBody}>
              <div style={s.gridCardCat}>{p.category}</div>
              <div className="adm-grid-card-name" style={s.gridCardName}>{p.name}</div>
              <div style={s.gridCardPriceRow}>
                {p.discountPrice
                  ? <>
                    <span className="adm-grid-card-price" style={{ ...s.gridCardPrice, color: '#0e0e0e' }}>
                      ₹{Number(p.discountPrice).toLocaleString('en-IN')}
                    </span>
                    <span style={s.gridCardOriginalPrice}>₹{Number(p.price).toLocaleString('en-IN')}</span>
                  </>
                  : <span className="adm-grid-card-price" style={s.gridCardPrice}>
                    ₹{Number(p.price).toLocaleString('en-IN')}
                  </span>
                }
              </div>
              <div style={s.gridCardMeta}>
                <span style={s.stockBadge(p.stock)}>
                  {p.stock === 0 ? 'No stock' : `${p.stock} in stock`}
                </span>
              </div>
            </div>
            <div style={s.gridCardFooter}>
              <button onClick={() => onEdit(p)} style={s.editBtnSm}><FaEdit style={{ marginRight: '0.3rem' }} />Edit</button>
              <button onClick={() => onDelete(p.id)} style={s.delBtnSm}><FaTrash style={{ marginRight: '0.3rem' }} />Delete</button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   TABLE VIEW
══════════════════════════════════════════════════════════════════════════ */
function TableView({ products, onEdit, onDelete }) {
  return (
    <div className="adm-table-wrap" style={s.tableWrap}>
      <table className="adm-table" style={s.table}>
        <thead>
          <tr style={s.thead}>
            <th style={s.th}>Product</th>
            <th style={s.th}>Category</th>
            <th style={s.th}>Price</th>
            <th style={s.th}>Stock</th>
            <th style={s.th}>Status</th>
            <th style={{ ...s.th, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => {
            const thumb = p.thumbnail || p.images?.[0]
            return (
              <tr key={p.id} style={{ ...s.tr, background: i % 2 === 0 ? '#fff' : '#fafaf8' }}>
                <td style={s.td}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {thumb
                      ? <img src={thumb} alt={p.name} style={s.tableThumb} />
                      : <div style={s.tableThumbPlaceholder}>?</div>
                    }
                    <div>
                      <div style={s.tableName}>{p.name}</div>
                      {p.sku && <div style={s.tableSku}>SKU: {p.sku}</div>}
                      {p.description && (
                        <div style={s.tableDesc}>
                          {p.description.slice(0, 55)}{p.description.length > 55 ? '…' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td style={s.td}>
                  <span style={s.catChip}>{p.category}</span>
                </td>
                <td style={s.td}>
                  {p.discountPrice
                    ? <div>
                      <div style={{ fontWeight: 700 }}>₹{Number(p.discountPrice).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>
                        ₹{Number(p.price).toLocaleString('en-IN')}
                      </div>
                    </div>
                    : <span style={{ fontWeight: 700 }}>₹{Number(p.price).toLocaleString('en-IN')}</span>
                  }
                </td>
                <td style={s.td}>
                  <span style={s.stockBadge(p.stock)}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock}`}
                  </span>
                </td>
                <td style={s.td}>
                  <span style={p.status === 'active' ? s.badgeActive : s.badgeDraft}>
                    {p.status === 'active' ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                    <button onClick={() => onEdit(p)} style={s.tableEditBtn}><FaEdit /></button>
                    <button onClick={() => onDelete(p.id)} style={s.tableDelBtn}><FaTrash /></button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   ANALYTICS TAB
══════════════════════════════════════════════════════════════════════════ */
function AnalyticsTab({ products }) {
  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    draft: products.filter(p => p.status === 'draft').length,
    outOfStock: products.filter(p => p.stock === 0).length,
    inStock: products.filter(p => p.stock > 0).length,
    totalValue: products.reduce((s, p) => s + (Number(p.price) || 0), 0),
    featured: products.filter(p => p.featured).length,
    bestSeller: products.filter(p => p.bestSeller).length,
    byCat: CATEGORIES.map(c => ({ cat: c, count: products.filter(p => p.category === c).length }))
      .filter(r => r.count > 0)
      .sort((a, b) => b.count - a.count),
  }

  return (
    <div className="adm-tab-content" style={s.tabContent}>
      <div className="adm-stats-grid" style={s.statsGrid}>
        {[
          { icon: <FaBoxOpen />, label: 'Total Products', value: stats.total, bg: '#eff6ff', border: '#bfdbfe', color: '#1d4ed8' },
          { icon: <FaCheckCircle />, label: 'Active Products', value: stats.active, bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d' },
          { icon: <FaTimesCircle />, label: 'Out of Stock', value: stats.outOfStock, bg: '#fef2f2', border: '#fecaca', color: '#b91c1c' },
          { icon: <FaMoneyBillWave />, label: 'Catalogue Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
        ].map(st => (
          <div key={st.label} style={{ ...s.bigStatCard, background: st.bg, borderColor: st.border }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem', color: st.color }}>{st.icon}</div>
            <div style={{ ...s.bigStatValue, color: st.color }}>{st.value}</div>
            <div style={s.bigStatLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Second row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Draft Products', value: stats.draft, color: '#f59e0b' },
          { label: 'In Stock', value: stats.inStock, color: '#22c55e' },
          { label: 'Featured', value: stats.featured, color: '#c8a96e' },
          { label: 'Best Sellers', value: stats.bestSeller, color: '#ef4444' },
        ].map(st => (
          <div key={st.label} style={s.quickStat}>
            <div style={{ ...s.quickStatValue, color: st.color }}>{st.value}</div>
            <div style={s.quickStatLabel}>{st.label}</div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div style={s.catBreakdownCard}>
        <h3 style={s.sectionHeading}>Products by Category</h3>
        <div style={s.catBreakdownList}>
          {stats.byCat.map(({ cat, count }) => {
            const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
            return (
              <div key={cat} style={s.catBreakdownRow}>
                <div className="adm-cat-left" style={s.catBreakdownLeft}>
                  <span style={{ fontSize: '1.1rem' }}>{CAT_ICONS[cat]}</span>
                  <span style={s.catBreakdownName}>{cat}</span>
                </div>
                <div style={s.catBreakdownRight}>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${pct}%` }} />
                  </div>
                  <span style={s.catBreakdownCount}>{count}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Low stock warning */}
      {stats.outOfStock > 0 && (
        <div style={s.soldOutCard}>
          <h3 style={s.sectionHeading}>
            <FaExclamationTriangle style={{ marginRight: '0.4rem', color: '#f59e0b' }} />
            Out of Stock ({stats.outOfStock})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '1rem' }}>
            {products.filter(p => p.stock === 0).map(p => (
              <div key={p.id} style={s.soldOutChip}>
                <span>{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
  const [msg, setMsg] = useState(null)
  const [confirmDel, setConfirmDel] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewMode, setViewMode] = useState('grid')
  const [activeTab, setActiveTab] = useState('products')

  // Form view state
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)

  useEffect(() => { if (authed) loadProducts() }, [authed])

  async function loadProducts() {
    setLoading(true)
    const list = await getAllProducts(ownerPwd)
    setProducts(list)
    setLoading(false)
  }

  function showMsg(type, text) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  function openAdd() {
    setEditingProduct(null)
    setShowForm(true)
  }

  function openEdit(product) {
    setEditingProduct(product)
    setShowForm(true)
  }

  async function handleDelete(id) {
    setDeleting(true)
    try {
      await deleteProduct(id, ownerPwd)
      showMsg('success', 'Product deleted.')
      setConfirmDel(null)
      await loadProducts()
    } catch (err) {
      showMsg('error', err.message)
    } finally {
      setDeleting(false)
    }
  }

  function handleFormSaved() {
    setShowForm(false)
    setEditingProduct(null)
    loadProducts()
  }

  /* Derived list */
  const filtered = products
    .filter(p => catFilter === 'All' || p.category === catFilter)
    .filter(p => statusFilter === 'All' || p.status === statusFilter)
    .filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (p.sku || '').toLowerCase().includes(search.toLowerCase())
    )

  const stats = {
    total: products.length,
    active: products.filter(p => p.status === 'active').length,
    outOfStock: products.filter(p => p.stock === 0).length,
    totalValue: products.reduce((s, p) => s + (Number(p.price) || 0), 0),
  }

  if (!authed) {
    return <LoginScreen onLogin={pwd => { setOwnerPwd(pwd); setAuthed(true) }} />
  }

  /* ── Form Page ────────────────────────────────────────── */
  if (showForm) {
    return (
      <div className="adm-dash" style={s.dashRoot}>
        <ResponsiveCss />
        <Sidebar activeTab="products" setActiveTab={() => { }} />
        <div className="adm-main" style={s.mainArea}>
          <Toast msg={msg} />
          <ProductFormPage
            editing={editingProduct?.id || null}
            initialData={editingProduct}
            ownerPwd={ownerPwd}
            onSaved={handleFormSaved}
            onCancel={() => setShowForm(false)}
            showMsg={showMsg}
          />
        </div>
      </div>
    )
  }

  /* ── Main Dashboard ───────────────────────────────────── */
  return (
    <div className="adm-dash" style={s.dashRoot}>
      <ResponsiveCss />
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="adm-main" style={s.mainArea}>
        {/* Topbar */}
        <div className="adm-topbar" style={s.topbar}>
          <div>
            <h1 style={s.topbarTitle}>
              {activeTab === 'products' ? 'Product Management' : 'Store Analytics'}
            </h1>
            <p style={s.topbarSub}>
              {activeTab === 'products'
                ? `${stats.total} products · ${stats.active} active · ${stats.outOfStock} out of stock`
                : 'Overview of your store performance'}
            </p>
          </div>
          {activeTab === 'products' && (
            <button onClick={openAdd} className="adm-add-btn" style={s.addBtn}>
              <FaPlus style={{ marginRight: '0.4rem' }} /> Add Product
            </button>
          )}
        </div>

        <Toast msg={msg} />

        {/* ── PRODUCTS TAB ───────────────────── */}
        {activeTab === 'products' && (
          <div className="adm-tab-content" style={s.tabContent}>
            {/* Quick stats */}
            <div className="adm-quick-stats" style={s.quickStats}>
              {[
                { label: 'Total Products', value: stats.total, color: '#3b82f6' },
                { label: 'Active', value: stats.active, color: '#22c55e' },
                { label: 'Out of Stock', value: stats.outOfStock, color: '#ef4444' },
                { label: 'Catalogue Value', value: `₹${stats.totalValue.toLocaleString('en-IN')}`, color: '#c8a96e' },
              ].map(st => (
                <div key={st.label} style={s.quickStat}>
                  <div style={{ ...s.quickStatValue, color: st.color }}>{st.value}</div>
                  <div style={s.quickStatLabel}>{st.label}</div>
                </div>
              ))}
            </div>

            {/* Toolbar */}
            <div className="adm-toolbar" style={s.toolbar}>
              <div className="adm-toolbar-left" style={s.toolbarLeft}>
                <div className="adm-search-wrap" style={s.searchWrap}>
                  <span style={s.searchIcon}><FaSearch /></span>
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, category, SKU…"
                    style={s.searchInput}
                  />
                  {search && <button onClick={() => setSearch('')} style={s.clearBtn}>✕</button>}
                </div>

                <select
                  className="adm-cat-select"
                  value={catFilter}
                  onChange={e => setCatFilter(e.target.value)}
                  style={s.catSelect}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{c} ({products.filter(p => p.category === c).length})</option>
                  ))}
                </select>

                <select
                  className="adm-cat-select"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  style={s.catSelect}
                >
                  <option value="All">All Status</option>
                  <option value="active">Active ({stats.active})</option>
                  <option value="draft">Draft ({products.filter(p => p.status === 'draft').length})</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#888' }}>{filtered.length} results</span>
                <button
                  onClick={() => setViewMode(v => v === 'grid' ? 'table' : 'grid')}
                  style={s.viewToggleBtn}
                  title={viewMode === 'grid' ? 'Switch to table' : 'Switch to grid'}
                >
                  {viewMode === 'grid' ? <><FaTable style={{ marginRight: '0.3rem' }} />Table</> : <><FaTh style={{ marginRight: '0.3rem' }} />Grid</>}
                </button>
              </div>
            </div>

            {/* Product list */}
            {loading && products.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#c8a96e' }}><FaSpinner /></div>
                <p>Loading products…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div style={s.emptyBox}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}><FaInbox /></div>
                <p style={{ marginBottom: '1rem' }}>
                  {search || catFilter !== 'All' || statusFilter !== 'All'
                    ? 'No products match your filters.'
                    : 'No products yet. Add your first product!'}
                </p>
                {(search || catFilter !== 'All' || statusFilter !== 'All') && (
                  <button onClick={() => { setSearch(''); setCatFilter('All'); setStatusFilter('All') }}
                    style={s.clearFilterBtn}>
                    Clear Filters
                  </button>
                )}
                <button onClick={openAdd} style={{ ...s.addBtn, marginTop: '0.75rem' }}>
                  <FaPlus style={{ marginRight: '0.4rem' }} /> Add Product
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <GridView products={filtered} onEdit={openEdit} onDelete={setConfirmDel} />
            ) : (
              <TableView products={filtered} onEdit={openEdit} onDelete={setConfirmDel} />
            )}
          </div>
        )}

        {/* ── ANALYTICS TAB ────────────────────── */}
        {activeTab === 'stats' && <AnalyticsTab products={products} />}
      </div>

      {/* Delete Confirm Dialog */}
      {confirmDel && (
        <div style={s.modalOverlay}>
          <div className="adm-confirm-card" style={s.confirmCard}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem', color: '#ef4444' }}><FaTrash /></div>
            <h3 style={{ fontFamily: 'Georgia, serif', marginBottom: '0.5rem' }}>Delete Product?</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              "{products.find(p => p.id === confirmDel)?.name}" will be permanently removed.
              Associated Cloudinary images will also be deleted.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setConfirmDel(null)} style={s.cancelBtn}>Cancel</button>
              <button
                onClick={() => handleDelete(confirmDel)}
                disabled={deleting}
                style={{ ...s.submitBtn, background: '#ef4444', borderColor: '#ef4444' }}
              >
                {deleting ? 'Deleting…' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   SHARED SUB-COMPONENTS
══════════════════════════════════════════════════════════════════════════ */
function Toast({ msg }) {
  if (!msg) return null
  return (
    <div style={{
      ...s.toast,
      ...(msg.type === 'success' ? s.toastSuccess : s.toastError),
    }}>
      {msg.type === 'success' ? '✓' : '✕'} {msg.text}
    </div>
  )
}

function Sidebar({ activeTab, setActiveTab }) {
  return (
    <aside className="adm-sidebar" style={s.sidebar}>
      <div className="adm-sidebar-brand" style={s.sidebarBrand}>
        <div style={s.sidebarBrandIcon}>A</div>
        <div>
          <div style={s.sidebarBrandName}>Aryan Studio</div>
          <div style={s.sidebarBrandSub}>Owner Panel</div>
        </div>
      </div>

      <nav className="adm-sidebar-nav" style={s.sidebarNav}>
        {[
          { id: 'products', icon: <FaBoxOpen />, label: 'Products' },
          { id: 'stats', icon: <FaChartBar />, label: 'Analytics' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{ ...s.sidebarLink, ...(activeTab === item.id ? s.sidebarLinkActive : {}) }}
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="adm-sidebar-bottom" style={s.sidebarBottom}>
        <a href="/" style={s.sidebarBackBtn}>← Back to Site</a>
      </div>
    </aside>
  )
}

function ResponsiveCss() {
  return (
    <style>{`
      @media (max-width: 768px) {
        .adm-dash { flex-direction: column !important; }
        .adm-sidebar {
          width: 100% !important; height: 60px !important; min-height: 60px !important;
          position: fixed !important; bottom: 0; left: 0; right: 0; top: auto !important;
          flex-direction: row !important; align-items: center;
          z-index: 200; border-top: 1px solid rgba(255,255,255,0.1) !important;
          padding: 0 !important; box-shadow: 0 -4px 20px rgba(0,0,0,0.3) !important;
        }
        .adm-sidebar-brand { display: none !important; }
        .adm-sidebar-nav { flex-direction: row !important; flex: 1; padding: 0 !important; gap: 0 !important; height: 100%; }
        .adm-sidebar-nav button {
          flex: 1 !important; flex-direction: column !important; gap: 3px !important;
          padding: 0.5rem 0 !important; font-size: 0.65rem !important; border-radius: 0 !important;
          justify-content: center !important; align-items: center !important;
          border-right: 1px solid rgba(255,255,255,0.06) !important; height: 100%; letter-spacing: 0.04em !important;
        }
        .adm-sidebar-nav button svg { font-size: 1.3rem !important; width: 1.3rem !important; height: 1.3rem !important; }
        .adm-sidebar-bottom { display: none !important; }
        .adm-main { padding-bottom: 72px !important; overflow-x: hidden !important; }
        .adm-topbar { padding: 0.75rem 1rem !important; flex-wrap: wrap; gap: 0.5rem; }
        .adm-topbar h1 { font-size: 1rem !important; }
        .adm-add-btn { font-size: 0.75rem !important; padding: 0.5rem 0.9rem !important; white-space: nowrap; }
        .adm-tab-content { padding: 1rem !important; }
        .adm-quick-stats { grid-template-columns: 1fr 1fr !important; gap: 0.6rem !important; }
        .adm-toolbar { flex-direction: column !important; align-items: stretch !important; gap: 0.75rem !important; }
        .adm-toolbar-left { flex-direction: column !important; gap: 0.6rem !important; }
        .adm-search-wrap { max-width: 100% !important; width: 100% !important; }
        .adm-search-wrap input { width: 100% !important; box-sizing: border-box !important; }
        .adm-cat-select { width: 100% !important; }
        .adm-grid-view { grid-template-columns: repeat(2, 1fr) !important; gap: 0.7rem !important; }
        .adm-table-wrap { overflow-x: auto !important; -webkit-overflow-scrolling: touch !important; }
        .adm-table { min-width: 560px !important; }
        .adm-confirm-card { margin: 1rem !important; width: calc(100% - 2rem) !important; }
        .adm-stats-grid { grid-template-columns: 1fr 1fr !important; gap: 0.75rem !important; }
        .adm-cat-left { width: 110px !important; font-size: 0.75rem !important; }
        .adm-grid-card-name { font-size: 0.78rem !important; }
        .adm-grid-card-price { font-size: 0.82rem !important; }
      }
      @media (max-width: 430px) {
        .adm-quick-stats { gap: 0.5rem !important; }
        .adm-grid-view { grid-template-columns: repeat(2, 1fr) !important; gap: 0.5rem !important; }
        .adm-tab-content { padding: 0.75rem !important; }
        .adm-topbar { padding: 0.65rem 0.75rem !important; }
        .adm-topbar h1 { font-size: 0.92rem !important; }
      }
      @supports (padding: max(0px)) {
        @media (max-width: 768px) {
          .adm-sidebar {
            padding-bottom: max(0px, env(safe-area-inset-bottom)) !important;
            height: calc(60px + env(safe-area-inset-bottom)) !important;
          }
          .adm-main { padding-bottom: calc(72px + env(safe-area-inset-bottom)) !important; }
        }
      }
    `}</style>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   STYLES
══════════════════════════════════════════════════════════════════════════ */
const s = {
  /* Login */
  loginBg: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0e0e0e 0%, #1a1628 100%)', padding: '2rem' },
  loginCard: { background: '#fff', borderRadius: 20, padding: '3rem 2.5rem', width: '100%', maxWidth: 420, textAlign: 'center', boxShadow: '0 30px 90px rgba(0,0,0,0.4)' },
  loginLogo: { width: 68, height: 68, background: '#0e0e0e', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' },
  loginBrand: { fontSize: '0.75rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#c8a96e', fontWeight: 600, marginBottom: '0.5rem' },
  loginTitle: { fontFamily: 'Georgia, serif', fontSize: '1.8rem', margin: '0 0 0.4rem' },
  loginSub: { color: '#888', fontSize: '0.88rem', margin: '0 0 2rem' },
  loginForm: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  pwdWrap: { position: 'relative' },
  pwdInput: { width: '100%', padding: '0.85rem 3rem 0.85rem 1rem', borderRadius: 10, border: '1.5px solid #ddd', fontSize: '1rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' },
  pwdInputErr: { borderColor: '#e53e3e' },
  eyeBtn: { position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' },
  errText: { color: '#e53e3e', fontSize: '0.82rem', margin: 0, textAlign: 'left' },
  loginBtn: { padding: '0.85rem', background: '#0e0e0e', color: '#fff', border: 'none', borderRadius: 10, fontSize: '1rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em' },
  forgotBtn: { background: 'none', border: 'none', color: '#c8a96e', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem', padding: '0.25rem' },

  /* Dashboard shell */
  dashRoot: { display: 'flex', minHeight: '100vh', background: '#f5f4f0', fontFamily: '"Inter", system-ui, sans-serif' },

  /* Sidebar */
  sidebar: { width: 220, background: '#0e0e0e', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', flexShrink: 0 },
  sidebarBrand: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1.5rem 1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)' },
  sidebarBrandIcon: { width: 36, height: 36, background: '#c8a96e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, color: '#fff', fontSize: '1.1rem' },
  sidebarBrandName: { color: '#fff', fontWeight: 700, fontSize: '0.9rem' },
  sidebarBrandSub: { color: '#c8a96e', fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase' },
  sidebarNav: { flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' },
  sidebarLink: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0.9rem', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.55)', fontSize: '0.87rem', fontWeight: 500, width: '100%', textAlign: 'left' },
  sidebarLinkActive: { background: 'rgba(200,169,110,0.15)', color: '#c8a96e' },
  sidebarBottom: { padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.08)' },
  sidebarBackBtn: { display: 'block', padding: '0.65rem 0.9rem', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', textDecoration: 'none', textAlign: 'center' },

  /* Main */
  mainArea: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto', height: '100vh' },
  topbar: { background: '#fff', borderBottom: '1px solid #e0ddd8', padding: '1.25rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'sticky', top: 0, zIndex: 10 },
  topbarTitle: { fontFamily: 'Georgia, serif', fontSize: '1.4rem', margin: 0 },
  topbarSub: { fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0' },
  addBtn: { display: 'inline-flex', alignItems: 'center', padding: '0.65rem 1.4rem', background: '#0e0e0e', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', letterSpacing: '0.04em', whiteSpace: 'nowrap' },

  /* Toast */
  toast: { position: 'fixed', top: '1.25rem', left: '50%', transform: 'translateX(-50%)', padding: '0.8rem 1.6rem', borderRadius: 10, fontWeight: 600, fontSize: '0.88rem', zIndex: 9999, boxShadow: '0 8px 30px rgba(0,0,0,0.18)', whiteSpace: 'nowrap' },
  toastSuccess: { background: '#064e3b', color: '#6ee7b7' },
  toastError: { background: '#7f1d1d', color: '#fca5a5' },

  /* Tab content */
  tabContent: { padding: '2rem', flex: 1 },

  /* Quick stats */
  quickStats: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '1.5rem' },
  quickStat: { background: '#fff', borderRadius: 10, padding: '1.1rem 1.25rem', border: '1px solid #e0ddd8', textAlign: 'center' },
  quickStatValue: { fontSize: '1.6rem', fontWeight: 700, fontFamily: 'Georgia,serif' },
  quickStatLabel: { fontSize: '0.72rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '0.2rem' },

  /* Toolbar */
  toolbar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  toolbarLeft: { display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 },
  searchWrap: { position: 'relative', flex: 1, minWidth: 180, maxWidth: 340 },
  searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: '0.85rem', pointerEvents: 'none', color: '#aaa' },
  searchInput: { width: '100%', padding: '0.6rem 2.2rem 0.6rem 2.4rem', border: '1.5px solid #e0ddd8', borderRadius: 8, fontSize: '0.85rem', outline: 'none', background: '#fff', fontFamily: 'inherit', boxSizing: 'border-box' },
  clearBtn: { position: 'absolute', right: '0.65rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: '0.8rem' },
  catSelect: { padding: '0.6rem 0.9rem', border: '1.5px solid #e0ddd8', borderRadius: 8, fontSize: '0.84rem', outline: 'none', background: '#fff', cursor: 'pointer', fontFamily: 'inherit' },
  viewToggleBtn: { padding: '0.55rem 1rem', background: '#fff', border: '1.5px solid #e0ddd8', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center' },

  /* Grid */
  gridView: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' },
  gridCard: { background: '#fff', borderRadius: 12, overflow: 'hidden', border: '1px solid #e0ddd8', display: 'flex', flexDirection: 'column' },
  gridCardImg: { position: 'relative', aspectRatio: '3/4', background: '#f0eeea', overflow: 'hidden' },
  gridImg: { width: '100%', height: '100%', objectFit: 'cover' },
  gridImgPlaceholder: { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  statusDot: { position: 'absolute', top: 8, right: 8, width: 10, height: 10, borderRadius: '50%', boxShadow: '0 0 0 2px #fff' },
  soldOutBadge: { position: 'absolute', top: 8, left: 8, background: 'rgba(239,68,68,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4 },
  bestSellerBadge: { position: 'absolute', bottom: 8, left: 8, background: 'rgba(245,158,11,0.9)', color: '#fff', fontSize: '0.6rem', fontWeight: 700, padding: '3px 7px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: '3px' },
  gridCardOverlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' },
  overlayBtn: { background: '#fff', border: 'none', borderRadius: 8, padding: '0.5rem 1.1rem', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center' },
  gridCardBody: { padding: '0.9rem 1rem 0.5rem', flex: 1 },
  gridCardCat: { fontSize: '0.68rem', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' },
  gridCardName: { fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  gridCardPriceRow: { display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '0.35rem' },
  gridCardPrice: { fontFamily: 'Georgia,serif', fontSize: '1rem', fontWeight: 700 },
  gridCardOriginalPrice: { fontSize: '0.78rem', color: '#bbb', textDecoration: 'line-through' },
  gridCardMeta: { display: 'flex', gap: '0.4rem', flexWrap: 'wrap' },
  gridCardFooter: { display: 'flex', gap: 0, borderTop: '1px solid #f0eeea' },
  editBtnSm: { flex: 1, padding: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#3b82f6', borderRight: '1px solid #f0eeea', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  delBtnSm: { flex: 1, padding: '0.6rem', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 500, color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' },

  stockBadge: (stock) => ({
    display: 'inline-block',
    fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 20,
    background: stock === 0 ? '#fef2f2' : stock < 5 ? '#fffbeb' : '#f0fdf4',
    color: stock === 0 ? '#b91c1c' : stock < 5 ? '#92400e' : '#15803d',
  }),

  /* Table */
  tableWrap: { background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8f7f4' },
  th: { padding: '0.85rem 1rem', fontSize: '0.72rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#888', textAlign: 'left', borderBottom: '1px solid #e0ddd8' },
  tr: { borderBottom: '1px solid #f0eeea' },
  td: { padding: '0.9rem 1rem', fontSize: '0.87rem', verticalAlign: 'middle' },
  tableThumb: { width: 52, height: 68, objectFit: 'cover', borderRadius: 6, flexShrink: 0 },
  tableThumbPlaceholder: { width: 52, height: 68, background: '#f0eeea', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bbb', flexShrink: 0 },
  tableName: { fontWeight: 600, fontSize: '0.88rem' },
  tableSku: { fontSize: '0.72rem', color: '#aaa', marginTop: '0.1rem' },
  tableDesc: { fontSize: '0.76rem', color: '#aaa', marginTop: '0.2rem' },
  catChip: { background: '#f5f4f0', border: '1px solid #e0ddd8', borderRadius: 20, padding: '0.2rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap' },
  badgeActive: { background: '#dcfce7', color: '#15803d', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20 },
  badgeDraft: { background: '#fef9c3', color: '#92400e', fontSize: '0.72rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: 20 },
  tableEditBtn: { width: 34, height: 34, background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' },
  tableDelBtn: { width: 34, height: 34, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 7, cursor: 'pointer', fontSize: '0.85rem' },

  /* Empty box */
  emptyBox: { background: '#fff', borderRadius: 12, padding: '4rem 2rem', textAlign: 'center', color: '#888', border: '1px solid #e0ddd8' },
  clearFilterBtn: { padding: '0.5rem 1.2rem', background: '#f5f4f0', border: '1.5px solid #e0ddd8', borderRadius: 8, cursor: 'pointer', fontSize: '0.85rem' },

  /* Analytics */
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
  barFill: { height: '100%', background: 'linear-gradient(90deg,#c8a96e,#a8894e)', borderRadius: 4, transition: 'width 0.5s ease' },
  catBreakdownCount: { fontSize: '0.82rem', fontWeight: 600, width: 24, textAlign: 'right' },
  soldOutCard: { background: '#fff', borderRadius: 12, padding: '1.75rem', border: '1px solid #fecaca' },
  soldOutChip: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 20, padding: '0.3rem 0.9rem', fontSize: '0.82rem' },

  /* Modal / confirm */
  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem', backdropFilter: 'blur(4px)' },
  confirmCard: { background: '#fff', borderRadius: 16, padding: '2.5rem', textAlign: 'center', maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' },

  /* Buttons */
  cancelBtn: { padding: '0.65rem 1.3rem', background: '#f5f4f0', border: '1.5px solid #e0ddd8', borderRadius: 8, fontSize: '0.87rem', fontWeight: 500, cursor: 'pointer' },
  submitBtn: { padding: '0.65rem 1.75rem', background: '#0e0e0e', color: '#fff', border: '2px solid #0e0e0e', borderRadius: 8, fontSize: '0.87rem', fontWeight: 600, cursor: 'pointer' },

  /* ── PRODUCT FORM PAGE ── */
  formPage: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' },
  formPageHeader: {
    padding: '1.25rem 2rem', background: '#fff', borderBottom: '1px solid #e0ddd8',
    display: 'flex', alignItems: 'center', gap: '1.5rem',
    position: 'sticky', top: 0, zIndex: 5,
  },
  formPageTitle: { fontFamily: 'Georgia, serif', fontSize: '1.3rem', margin: 0 },
  formPageSub: { fontSize: '0.8rem', color: '#888', margin: '0.2rem 0 0' },
  backBtn: {
    display: 'inline-flex', alignItems: 'center',
    padding: '0.55rem 1rem', background: '#f5f4f0',
    border: '1.5px solid #e0ddd8', borderRadius: 8,
    fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
  },
  formLayout: {
    display: 'grid', gridTemplateColumns: '1fr 380px',
    gap: '1.5rem', padding: '1.75rem 2rem',
    alignItems: 'start',
  },
  formLeft: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  formRight: { display: 'flex', flexDirection: 'column', gap: '1.25rem' },

  /* Section card */
  section: { background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8', overflow: 'hidden' },
  sectionHead: { display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 1.25rem', borderBottom: '1px solid #f0eeea', background: '#fafaf8' },
  sectionIcon: { color: '#c8a96e', fontSize: '0.9rem', display: 'flex', alignItems: 'center' },
  sectionTitle: { fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: '#555' },
  sectionBody: { padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' },

  /* Form fields */
  formGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' },
  formGrid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' },
  req: { color: '#e53e3e' },
  input: {
    padding: '0.65rem 0.9rem', border: '1.5px solid #e2e2e2', borderRadius: 8,
    fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit', background: '#fafafa',
    width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  },

  /* Status toggle */
  statusRow: { display: 'flex', gap: '0.5rem' },
  statusBtn: { padding: '0.5rem 1.1rem', borderRadius: 20, border: '1.5px solid #e0ddd8', background: '#f5f4f0', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
  statusBtnActive: { background: '#dcfce7', borderColor: '#86efac', color: '#15803d', fontWeight: 700 },
  statusBtnDraft: { background: '#fef9c3', borderColor: '#fde047', color: '#92400e', fontWeight: 700 },

  /* Savings badge */
  savingsBadge: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: '#15803d', fontWeight: 500 },

  /* Out of stock note */
  outOfStockNote: { background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '0.5rem 0.85rem', fontSize: '0.82rem', color: '#92400e' },

  /* Size pills */
  sizePills: { display: 'flex', flexWrap: 'wrap', gap: '0.5rem' },
  sizePill: { padding: '0.35rem 0.85rem', borderRadius: 20, border: '1.5px solid #e0ddd8', background: '#f5f4f0', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
  sizePillActive: { background: '#0e0e0e', borderColor: '#0e0e0e', color: '#fff', fontWeight: 700 },

  /* Tag input */
  tagRoot: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  tagPills: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem 0.75rem', border: '1.5px solid #e2e2e2', borderRadius: 8, background: '#fafafa', minHeight: 42, alignItems: 'center' },
  tagPill: { display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: '#0e0e0e', color: '#fff', borderRadius: 20, padding: '0.2rem 0.4rem 0.2rem 0.75rem', fontSize: '0.78rem', fontWeight: 500 },
  tagRemove: { background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '0.9rem', lineHeight: 1, padding: '0 2px' },
  tagInput: { flex: 1, minWidth: 100, border: 'none', outline: 'none', background: 'transparent', fontSize: '0.85rem', fontFamily: 'inherit', padding: '2px 0' },
  tagSuggestions: { display: 'flex', flexWrap: 'wrap', gap: '0.35rem' },
  tagSuggestionChip: { padding: '0.2rem 0.65rem', borderRadius: 20, border: '1px dashed #d0d0d0', background: 'transparent', fontSize: '0.75rem', cursor: 'pointer', color: '#666', transition: 'all 0.15s' },

  /* Toggle */
  toggleTrack: { width: 44, height: 24, borderRadius: 12, position: 'relative', transition: 'background 0.25s', flexShrink: 0 },
  toggleThumb: { width: 18, height: 18, background: '#fff', borderRadius: '50%', position: 'absolute', top: 3, transition: 'left 0.25s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' },
  toggleRow: { display: 'flex', gap: '0.85rem', alignItems: 'flex-start', cursor: 'pointer', padding: '0.5rem 0', borderBottom: '1px solid #f5f4f0' },
  toggleLabel: { fontSize: '0.88rem', fontWeight: 600, color: '#2d2d2d' },
  toggleSub: { fontSize: '0.75rem', color: '#999', marginTop: '0.1rem' },

  /* Image section note */
  imageSectionNote: { fontSize: '0.78rem', color: '#888', margin: '0 0 0.5rem', lineHeight: 1.6 },

  /* Action card */
  actionCard: { background: '#fff', borderRadius: 12, border: '1px solid #e0ddd8', padding: '1.25rem' },
  actionTitle: { fontFamily: 'Georgia, serif', fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.4rem' },
  actionSub: { fontSize: '0.78rem', color: '#888', marginBottom: '1rem', lineHeight: 1.5 },
  publishBtn: { width: '100%', padding: '0.85rem', background: '#0e0e0e', color: '#fff', border: 'none', borderRadius: 10, fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  draftBtn: { width: '100%', padding: '0.75rem', background: '#f5f4f0', color: '#555', border: '1.5px solid #e0ddd8', borderRadius: 10, fontSize: '0.88rem', fontWeight: 500, cursor: 'pointer', marginBottom: '0.65rem' },
  cancelFormBtn: { width: '100%', padding: '0.65rem', background: 'transparent', color: '#aaa', border: 'none', borderRadius: 8, fontSize: '0.82rem', cursor: 'pointer', marginTop: '0.25rem' },
}
