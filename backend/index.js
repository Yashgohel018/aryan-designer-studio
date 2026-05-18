const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// ── Owner password (change this to your own secret) ─────────────────────────
const OWNER_PASSWORD = 'aryan@admin123';

app.use(cors({
  origin: [
    'http://localhost:5173',
    /\.vercel\.app$/,          // allows all *.vercel.app preview & prod URLs
  ],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));

// Helper to read data
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error reading data:", err);
        return [];
    }
}

// Helper to write data
function writeData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        return true;
    } catch (err) {
        console.error("Error writing data:", err);
        return false;
    }
}

// Middleware – verify owner password header for write routes
function requireOwner(req, res, next) {
    const pwd = req.headers['x-owner-password'];
    if (pwd !== OWNER_PASSWORD) {
        return res.status(401).json({ error: 'Unauthorized. Wrong owner password.' });
    }
    next();
}

app.get('/', (req, res) => {
    res.send('Hello from Aryan Designer Studio Backend!');
});

// ── Auth: verify owner password ──────────────────────────────────────────────
app.post('/api/auth/owner', (req, res) => {
    const { password } = req.body;
    if (password === OWNER_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, error: 'Wrong password' });
    }
});

// ── GET all products (public) ────────────────────────────────────────────────
app.get('/api/products', (req, res) => {
    const products = readData();
    res.json(products);
});

// ── POST add a single new product (owner only) ───────────────────────────────
app.post('/api/products/add', requireOwner, (req, res) => {
    const products = readData();
    const newProduct = req.body;

    if (!newProduct.name || newProduct.price === undefined) {
        return res.status(400).json({ error: 'name and price are required' });
    }

    newProduct.id = 'prod_' + Date.now();
    if (!Array.isArray(newProduct.images)) {
        newProduct.images = newProduct.images ? [newProduct.images] : [];
    }
    newProduct.soldOut = !!newProduct.soldOut;

    products.push(newProduct);
    if (writeData(products)) {
        res.status(201).json({ success: true, product: newProduct });
    } else {
        res.status(500).json({ error: 'Failed to save product' });
    }
});

// ── PUT update product by id (owner only) ────────────────────────────────────
app.put('/api/products/:id', requireOwner, (req, res) => {
    const products = readData();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const updated = { ...products[idx], ...req.body, id: req.params.id };
    if (!Array.isArray(updated.images)) {
        updated.images = updated.images ? [updated.images] : [];
    }
    updated.soldOut = !!updated.soldOut;
    products[idx] = updated;

    if (writeData(products)) {
        res.json({ success: true, product: updated });
    } else {
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// ── DELETE product by id (owner only) ────────────────────────────────────────
app.delete('/api/products/:id', requireOwner, (req, res) => {
    const products = readData();
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    products.splice(idx, 1);
    if (writeData(products)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

// ── POST bulk-save all products (owner only) ─────────────────────────────────
app.post('/api/products', requireOwner, (req, res) => {
    const products = req.body;
    if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Expected an array of products.' });
    }
    if (writeData(products)) {
        res.json({ success: true, count: products.length, message: 'Products saved successfully.' });
    } else {
        res.status(500).json({ error: 'Failed to save products.' });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Network access: http://<your-ip>:${PORT}`);
});
