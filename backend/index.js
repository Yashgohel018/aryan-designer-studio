require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const rateLimit  = require('express-rate-limit');
const fs         = require('fs');
const path       = require('path');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const crypto     = require('crypto');
const mongoose   = require('mongoose');

// ── App Setup ─────────────────────────────────────────────────────────────────
const app         = express();
const PORT        = process.env.PORT || 5000;
const CONFIG_FILE = path.join(__dirname, 'data', 'config.json'); // local dev fallback for password only

// ── MongoDB Connection ─────────────────────────────────────────────────────────
let dbConnected = false;
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => { dbConnected = true; })
    .catch(err => console.error('   MongoDB:    ✗ connection failed:', err.message));
} else {
  console.warn('   MongoDB:    ⚠ MONGODB_URI not set — products will NOT persist!');
}

// ── Product Schema & Model ────────────────────────────────────────────────────
const productSchema = new mongoose.Schema({
  id:            { type: String, required: true, unique: true },
  name:          { type: String, default: '' },
  category:      { type: String, default: '' },
  subcategory:   { type: String, default: '' },
  brand:         { type: String, default: 'Aryan Designer Studio' },
  sku:           { type: String, default: '' },
  price:         { type: Number, default: 0 },
  discountPrice: { type: Number, default: null },
  stock:         { type: Number, default: 0 },
  description:   { type: String, default: '' },
  sizes:         [String],
  colors:        [String],
  tags:          [String],
  featured:      { type: Boolean, default: false },
  newArrival:    { type: Boolean, default: false },
  bestSeller:    { type: Boolean, default: false },
  status:        { type: String, default: 'active' },
  thumbnail:     { type: String, default: null },
  images:        [String],
  views:         { type: Number, default: 0 },
  soldCount:     { type: Number, default: 0 },
  createdAt:     { type: String, default: '' },
  updatedAt:     { type: String, default: '' },
  soldOut:       { type: Boolean, default: false },
  fabric:        { type: String, default: '' },
}, { versionKey: false });

const Product = mongoose.model('Product', productSchema);

// Helper: strip MongoDB _id from query results
const NO_ID = { _id: 0 };

// ── Cloudinary Config ─────────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});
const UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER || 'aryan-designer-studio/products';

// ── Multer (memory storage — files held in RAM, then streamed to Cloudinary) ──
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 },         // 15 MB per file
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── Owner Password ───────────────────────────────────────────────────────────
// Priority: Upstash Redis (production) → config.json (local dev) → OWNER_PASSWORD env
const OFFICIAL_EMAIL = 'aryandesignerstudio7@gmail.com';
const REDIS_URL   = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const REDIS_KEY   = 'ads:ownerPassword';

async function getOwnerPassword() {
  // 1. Try Upstash Redis (production)
  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const res = await fetch(`${REDIS_URL}/get/${REDIS_KEY}`, {
        headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
      });
      const { result } = await res.json();
      if (result) return result;
    } catch (e) {
      console.error('[Redis] getOwnerPassword error:', e.message);
    }
  }
  // 2. Try local config.json (dev)
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (cfg.ownerPassword) return cfg.ownerPassword;
  } catch { /* no config.json yet */ }
  // 3. Fallback to env var
  return process.env.OWNER_PASSWORD || 'aryan@admin123';
}

async function saveOwnerPassword(newPassword) {
  // 1. Save to Upstash Redis (production)
  if (REDIS_URL && REDIS_TOKEN) {
    const res = await fetch(`${REDIS_URL}/set/${REDIS_KEY}/${encodeURIComponent(newPassword)}`, {
      headers: { Authorization: `Bearer ${REDIS_TOKEN}` },
    });
    const data = await res.json();
    if (data.result !== 'OK') throw new Error('Redis save failed: ' + JSON.stringify(data));
    console.log('[Redis] Owner password saved to Upstash.');
    return;
  }
  // 2. Fallback: save to local config.json (dev)
  let cfg = {};
  try { cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')); } catch { /* first time */ }
  cfg.ownerPassword = newPassword;
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf8');
  console.log('[Config] Owner password saved to config.json (local dev).');
}

// ── OTP store (in-memory, keyed by token, expires in 10 minutes) ─────────────
const otpStore = new Map();  // { token → { otp, expiry } }
const resetTokenStore = new Map(); // { resetToken → expiry } — valid for 10 min after OTP verify

function cleanupExpired() {
  const now = Date.now();
  for (const [k, v] of otpStore.entries())  { if (v.expiry < now) otpStore.delete(k); }
  for (const [k, v] of resetTokenStore.entries()) { if (v < now) resetTokenStore.delete(k); }
}
setInterval(cleanupExpired, 60_000);

// ── Nodemailer transporter ─────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

async function sendOTPEmail(otp) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"Aryan Designer Studio" <${process.env.GMAIL_USER}>`,
    to:   OFFICIAL_EMAIL,
    subject: '🔐 Admin Password Reset OTP — Aryan Designer Studio',
    html: `
      <div style="font-family:'Inter',system-ui,sans-serif;max-width:480px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1)">
        <div style="background:#0e0e0e;padding:2rem;text-align:center">
          <div style="font-family:Georgia,serif;color:#c8a96e;font-size:1.4rem;font-weight:700;letter-spacing:0.06em">ARYAN DESIGNER STUDIO</div>
          <div style="color:rgba(255,255,255,0.5);font-size:0.78rem;margin-top:0.25rem;letter-spacing:0.15em;text-transform:uppercase">Owner Portal</div>
        </div>
        <div style="padding:2.5rem;text-align:center">
          <h2 style="font-family:Georgia,serif;margin:0 0 0.5rem;color:#0e0e0e">Password Reset OTP</h2>
          <p style="color:#666;font-size:0.9rem;margin:0 0 2rem;line-height:1.6">Use the code below to reset your admin password. This code expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f5f4f0;border:2px dashed #c8a96e;border-radius:12px;padding:1.5rem;margin:0 auto 2rem;display:inline-block;min-width:200px">
            <div style="font-size:2.8rem;font-weight:800;letter-spacing:0.3em;color:#0e0e0e;font-family:'Courier New',monospace">${otp}</div>
          </div>
          <p style="color:#999;font-size:0.8rem;line-height:1.6">If you didn't request this, please ignore this email.<br>Your password will remain unchanged.</p>
        </div>
        <div style="background:#f5f4f0;padding:1rem;text-align:center;font-size:0.72rem;color:#aaa">
          © ${new Date().getFullYear()} Aryan Designer Studio · Surat, India
        </div>
      </div>
    `,
  });
}

// ── CORS ──────────────────────────────────────────────────────────────────────
// Locked to only YOUR Vercel deployment + localhost dev
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://aryan-designer-studio-git-master-yashgohel018s-projects.vercel.app',
  'https://aryan-designer-studio-3bwmr8ivw-yashgohel018s-projects.vercel.app',
  // Add your final custom domain here if you ever set one:
  // 'https://www.aryandesignerstudio.com',
];
app.use(cors({
  origin: (incomingOrigin, callback) => {
    // Allow server-to-server calls (e.g. GitHub Actions ping) and whitelisted origins
    if (!incomingOrigin || ALLOWED_ORIGINS.includes(incomingOrigin)) {
      callback(null, true)
    } else {
      callback(new Error(`CORS: origin '${incomingOrigin}' not allowed`))
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// ── Rate limiting — protect auth endpoints from brute-force ──────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // max 10 attempts per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again after 15 minutes.' },
});
// Apply to all auth routes
app.use('/api/auth', authLimiter);

// ── Auth middleware ───────────────────────────────────────────────────────────
async function requireOwner(req, res, next) {
  const pwd = req.headers['x-owner-password'];
  const correct = await getOwnerPassword();
  if (pwd !== correct) {
    return res.status(401).json({ error: 'Unauthorized. Wrong owner password.' });
  }
  next();
}

// ── Cloudinary image upload helper ───────────────────────────────────────────
function uploadToCloudinary(fileBuffer, originalName) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder:          UPLOAD_FOLDER,
        use_filename:    true,
        unique_filename: true,
        overwrite:       false,
        resource_type:   'image',
        format:          'webp',
        transformation:  [
          { width: 1200, height: 1600, crop: 'limit', quality: 'auto:best' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// ── Cloudinary image deletion helper ─────────────────────────────────────────
async function deleteCloudinaryImages(imageUrls) {
  if (!imageUrls || imageUrls.length === 0) return;
  const publicIds = imageUrls.map(url => {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
    return match ? match[1] : null;
  }).filter(Boolean);

  for (const publicId of publicIds) {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (err) {
      console.error(`Failed to delete Cloudinary image ${publicId}:`, err.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

app.get('/', (_req, res) => {
  res.send('Aryan Designer Studio — Backend is running ✓');
});

// ── Auth — Login ──────────────────────────────────────────────────────────────
app.post('/api/auth/owner', async (req, res) => {
  const { password } = req.body;
  const correct = await getOwnerPassword();
  if (password === correct) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: 'Wrong password' });
  }
});

// ── Auth — Forgot Password: Send OTP ─────────────────────────────────────────
app.post('/api/auth/forgot-password', async (_req, res) => {
  // Rate-limit: only 3 active OTPs allowed in store at once
  if (otpStore.size >= 3) {
    cleanupExpired();
  }

  const otp       = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const token     = crypto.randomBytes(24).toString('hex');
  const expiry    = Date.now() + 10 * 60 * 1000; // 10 minutes

  otpStore.set(token, { otp, expiry });

  const gmailConfigured = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD &&
    process.env.GMAIL_APP_PASSWORD !== 'your_16char_app_password_here');

  if (!gmailConfigured) {
    // Dev fallback: log OTP to console
    console.log(`\n[DEV] OTP for password reset: ${otp}\n`);
    return res.json({
      success: true,
      token,
      dev: true,
      message: 'Gmail not configured — OTP printed to backend console.',
    });
  }

  try {
    await sendOTPEmail(otp);
    res.json({
      success: true,
      token,
      message: `OTP sent to ${OFFICIAL_EMAIL}`,
    });
  } catch (err) {
    console.error('Email send error:', err);
    otpStore.delete(token);
    res.status(500).json({
      success: false,
      error: 'Failed to send OTP email. Check Gmail App Password in .env.',
      details: err.message,
    });
  }
});

// ── Auth — Verify OTP ─────────────────────────────────────────────────────────
app.post('/api/auth/verify-otp', (req, res) => {
  const { token, otp } = req.body;

  if (!token || !otp) {
    return res.status(400).json({ success: false, error: 'token and otp are required.' });
  }

  const entry = otpStore.get(token);
  if (!entry) {
    return res.status(400).json({ success: false, error: 'Invalid or expired session. Request a new OTP.' });
  }
  if (Date.now() > entry.expiry) {
    otpStore.delete(token);
    return res.status(400).json({ success: false, error: 'OTP has expired. Request a new one.' });
  }
  if (entry.otp !== otp.trim()) {
    return res.status(400).json({ success: false, error: 'Incorrect OTP. Please try again.' });
  }

  // OTP verified — issue a one-time reset token valid for 10 minutes
  otpStore.delete(token);
  const resetToken = crypto.randomBytes(32).toString('hex');
  resetTokenStore.set(resetToken, Date.now() + 10 * 60 * 1000);

  res.json({ success: true, resetToken });
});

// ── Auth — Reset Password ─────────────────────────────────────────────────────
app.post('/api/auth/reset-password', (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ success: false, error: 'resetToken and newPassword are required.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }

  const expiry = resetTokenStore.get(resetToken);
  if (!expiry) {
    return res.status(400).json({ success: false, error: 'Invalid reset session. Start over.' });
  }
  if (Date.now() > expiry) {
    resetTokenStore.delete(resetToken);
    return res.status(400).json({ success: false, error: 'Reset session expired. Request a new OTP.' });
  }

  // Save new password
  try {
    saveOwnerPassword(newPassword);
    resetTokenStore.delete(resetToken);
    console.log('[Auth] Owner password updated via Forgot Password flow.');
    res.json({ success: true, message: 'Password updated successfully!' });
  } catch (err) {
    console.error('Failed to save password:', err);
    res.status(500).json({ success: false, error: 'Failed to save new password.' });
  }
});

// ── GET all ACTIVE products (public storefront) ───────────────────────────────
app.get('/api/products', async (_req, res) => {
  try {
    const products = await Product.find({ status: 'active' }, NO_ID).lean();
    res.json(products);
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── GET ALL products including drafts (admin only) ────────────────────────────
app.get('/api/products/all', requireOwner, async (_req, res) => {
  try {
    const products = await Product.find({}, NO_ID).lean();
    res.json(products);
  } catch (err) {
    console.error('GET /api/products/all error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// ── POST upload images to Cloudinary (owner only) ────────────────────────────
app.post('/api/products/upload-images', requireOwner, upload.array('images', 5), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'No files received.' });
  }

  try {
    const uploadResults = await Promise.all(
      req.files.map(file => uploadToCloudinary(file.buffer, file.originalname))
    );

    const urls      = uploadResults.map(r => r.secure_url);
    const publicIds = uploadResults.map(r => r.public_id);

    res.json({
      success: true,
      urls,
      publicIds,
      thumbnail: urls[0] || null,
    });
  } catch (err) {
    console.error('Cloudinary upload error:', err);
    res.status(500).json({
      error: 'One or more images failed to upload. Please retry.',
      details: err.message,
    });
  }
});

// ── POST add a new product (owner only) ───────────────────────────────────────
app.post('/api/products/add', requireOwner, async (req, res) => {
  const body = req.body;

  if (!body.name || body.name.trim() === '') {
    return res.status(400).json({ error: 'Product name is required.' });
  }
  if (body.price === undefined || body.price === null || body.price === '') {
    return res.status(400).json({ error: 'Price is required.' });
  }
  if (!Array.isArray(body.images) || body.images.length === 0) {
    return res.status(400).json({ error: 'At least one product image is required.' });
  }

  try {
    // Check duplicate SKU
    if (body.sku && body.sku.trim() !== '') {
      const skuExists = await Product.findOne({ sku: body.sku.trim() });
      if (skuExists) {
        return res.status(409).json({ error: `SKU "${body.sku}" already exists.` });
      }
    }

    const now = new Date().toISOString();
    const newProduct = {
      id:            'prod_' + Date.now(),
      name:          (body.name || '').trim(),
      category:      (body.category || '').trim(),
      subcategory:   (body.subcategory || '').trim(),
      brand:         (body.brand || 'Aryan Designer Studio').trim(),
      sku:           (body.sku || '').trim(),
      price:         Number(body.price) || 0,
      discountPrice: body.discountPrice ? Number(body.discountPrice) : null,
      stock:         Number(body.stock) || 0,
      description:   (body.description || '').trim(),
      sizes:         Array.isArray(body.sizes)  ? body.sizes  : [],
      colors:        Array.isArray(body.colors) ? body.colors : [],
      tags:          Array.isArray(body.tags)   ? body.tags   : [],
      featured:      !!body.featured,
      newArrival:    !!body.newArrival,
      bestSeller:    !!body.bestSeller,
      status:        body.status === 'active' ? 'active' : 'draft',
      thumbnail:     body.images[0] || null,
      images:        body.images,
      views:         0,
      soldCount:     0,
      createdAt:     now,
      updatedAt:     now,
      soldOut:       (Number(body.stock) || 0) === 0,
      fabric:        (body.fabric || '').trim(),
    };

    await Product.create(newProduct);
    res.status(201).json({ success: true, product: newProduct });
  } catch (err) {
    console.error('POST /api/products/add error:', err);
    res.status(500).json({ error: 'Failed to save product.' });
  }
});

// ── GET single product by id (public) ────────────────────────────────────────
app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }, NO_ID).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error('GET /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// ── PUT update product by id (owner only) ────────────────────────────────────
app.put('/api/products/:id', requireOwner, async (req, res) => {
  try {
    const existing = await Product.findOne({ id: req.params.id }, NO_ID).lean();
    if (!existing) return res.status(404).json({ error: 'Product not found.' });

    const body = req.body;

    // Check duplicate SKU (excluding this product)
    if (body.sku && body.sku.trim() !== '') {
      const skuConflict = await Product.findOne({ sku: body.sku.trim(), id: { $ne: req.params.id } });
      if (skuConflict) {
        return res.status(409).json({ error: `SKU "${body.sku}" already in use by another product.` });
      }
    }

    const now    = new Date().toISOString();
    const images = Array.isArray(body.images) && body.images.length > 0
      ? body.images : existing.images;

    const updated = {
      name:          body.name !== undefined        ? String(body.name).trim()         : existing.name,
      category:      body.category !== undefined    ? String(body.category).trim()     : existing.category,
      subcategory:   body.subcategory !== undefined ? String(body.subcategory).trim()  : existing.subcategory,
      brand:         body.brand !== undefined       ? String(body.brand).trim()        : existing.brand,
      sku:           body.sku !== undefined         ? String(body.sku).trim()          : existing.sku,
      price:         body.price !== undefined       ? Number(body.price)               : existing.price,
      discountPrice: body.discountPrice !== undefined
                       ? (body.discountPrice === '' || body.discountPrice === null ? null : Number(body.discountPrice))
                       : existing.discountPrice,
      stock:         body.stock !== undefined       ? Number(body.stock)               : existing.stock,
      description:   body.description !== undefined ? String(body.description).trim()  : existing.description,
      sizes:         Array.isArray(body.sizes)      ? body.sizes                       : existing.sizes,
      colors:        Array.isArray(body.colors)     ? body.colors                      : existing.colors,
      tags:          Array.isArray(body.tags)       ? body.tags                        : existing.tags,
      featured:      body.featured !== undefined    ? !!body.featured                  : existing.featured,
      newArrival:    body.newArrival !== undefined  ? !!body.newArrival                : existing.newArrival,
      bestSeller:    body.bestSeller !== undefined  ? !!body.bestSeller                : existing.bestSeller,
      status:        body.status === 'active' || body.status === 'draft'
                       ? body.status : existing.status,
      thumbnail:     images[0] || existing.thumbnail,
      images,
      fabric:        body.fabric !== undefined      ? String(body.fabric).trim()       : (existing.fabric || ''),
      soldOut:       (body.stock !== undefined ? Number(body.stock) : existing.stock) === 0,
      updatedAt:     now,
    };

    await Product.updateOne({ id: req.params.id }, { $set: updated });
    res.json({ success: true, product: { ...existing, ...updated } });
  } catch (err) {
    console.error('PUT /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

// ── DELETE product by id (owner only) ────────────────────────────────────────
app.delete('/api/products/:id', requireOwner, async (req, res) => {
  try {
    const product = await Product.findOne({ id: req.params.id }, NO_ID).lean();
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    deleteCloudinaryImages([...(product.images || [])].filter(Boolean))
      .catch(e => console.error('Cloudinary cleanup error:', e.message));

    await Product.deleteOne({ id: req.params.id });
    res.json({ success: true, deleted: req.params.id });
  } catch (err) {
    console.error('DELETE /api/products/:id error:', err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// ── POST bulk-save products (owner only — kept for backward compat) ────────────
app.post('/api/products', requireOwner, async (req, res) => {
  const products = req.body;
  if (!Array.isArray(products)) {
    return res.status(400).json({ error: 'Expected an array of products.' });
  }
  try {
    await Product.deleteMany({});
    if (products.length > 0) {
      await Product.insertMany(products);
    }
    res.json({ success: true, count: products.length });
  } catch (err) {
    console.error('POST /api/products bulk error:', err);
    res.status(500).json({ error: 'Failed to save products.' });
  }
});

// ── Legacy helpers ─────────────────────────────────────────────────────────────
// resetToDefault: not implemented on server

// ── Keep-alive ping (called by the frontend every 14 min to prevent Render
//    free-tier sleep; also useful as a general health-check endpoint) ──────────
app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  const cloudOk  = !!process.env.CLOUDINARY_CLOUD_NAME;
  const gmailOk  = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD &&
    process.env.GMAIL_APP_PASSWORD !== 'your_16char_app_password_here');
  const redisOk  = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
  const mongoOk  = !!process.env.MONGODB_URI;
  console.log(`\n🚀 Aryan Designer Studio Backend`);
  console.log(`   Server:     http://localhost:${PORT}`);
  console.log(`   MongoDB:    ${mongoOk ? '✓ connecting...' : '✗ NOT configured (products will not persist!)'}`);
  console.log(`   Cloudinary: ${cloudOk ? '✓ configured' : '✗ NOT configured (set env vars)'}`);
  console.log(`   Gmail OTP:  ${gmailOk ? `✓ configured (${process.env.GMAIL_USER})` : '✗ NOT configured — OTPs will print to console'}`);
  console.log(`   Redis (pwd): ${redisOk ? '✓ configured (password resets persist)' : '✗ NOT configured — using local config.json (dev only)'}`);
  console.log('');
});
