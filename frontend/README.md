# Aryan Designer Studio — Frontend Prototype

This is a small React + Vite frontend prototype for a clothing brand site that lets customers browse products, add to cart, and send the final order to WhatsApp.

Quick start:

```bash
cd aryan-designer-studio
npm install
npm run dev
```

Notes:
- Replace the placeholder WhatsApp number in `src/pages/Cart.jsx` (`OWNER_WHATSAPP`) with your brother's full phone number including country code (e.g. `+919876543210`).
- Images use Unsplash placeholders; replace with real assets when ready.
- Cart persists in `localStorage` under key `ads_cart`.

Admin & bulk products:
- Open `/admin` route when the dev server is running to generate 200 sample products or paste a JSON array to bulk-import products.
- Imported products are saved in `localStorage` under key `ads_products` and will override the bundled sample list.

Deployment / production notes
- Set `VITE_OWNER_WHATSAPP` to your brother's phone number (include country code, e.g. `+919876543210`) in the deploy environment. The app reads this value at build/runtime and uses it to construct the WhatsApp `wa.me` links.
- Recommended hosts: Vercel or Netlify. Both support Vite apps and environment variables.

Netlify quick deploy (recommended):
1. Push to a Git repo (GitHub/GitLab/Bitbucket).
2. On Netlify, create a new site from Git and point to this repository.
3. Build command: `npm run build`. Publish directory: `dist`.
4. Add an environment variable `VITE_OWNER_WHATSAPP` in Netlify site settings.

Vercel quick deploy:
1. Push to Git provider.
2. Import project in Vercel, select framework "Vite".
3. Build command: `npm run build`. Output directory: `dist`.
4. Add `VITE_OWNER_WHATSAPP` in Project > Environment Variables.

Local build & preview:
```bash
npm run build
npm run preview
```

How to post your products (recommended)

- Quick method (no backend): use the Admin import
	1. Open the app locally and go to `/admin`.
	2. Paste a JSON array of product objects (see `sample_products.json` in the project root for an example).
	3. Click "Save Products" — this writes to browser `localStorage` (key `ads_products`) and your shop will show the imported items.

- JSON schema (each item):

```
{
	"id": "unique_id",
	"name": "Product Name",
	"price": 1999,
	"category": "Casual Wear",
	"images": ["https://...jpg"],
	"fabric": "Cotton",
	"description": "Short description",
	"soldOut": false
}
```

- Bulk workflow for production:
	- Host images on a CDN (Cloudinary, Firebase Storage, Google Drive public links) and use those URLs in `images`.
	- Prepare a CSV or spreadsheet with product fields and export to JSON (or use a small script to convert CSV→JSON).
	- Paste the JSON into `/admin` or extend `Admin` to accept CSV upload (I can add that).

Notes:
- The Admin import is for quick management and testing. For a real store, you should add a small backend or Google Sheet integration so the product data is persisted server-side.
- `sample_products.json` is provided as a template you can edit before importing.


What's included:
- Home, Products, Product Detail, Cart, About, Contact pages
- Cart with quantity, remove, and "Send Order on WhatsApp" feature

Optional next steps I can implement:
- Admin panel (Google Sheet integration)
- Image optimization + lazy loading
- More product data and categories
