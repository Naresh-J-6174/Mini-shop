# ShopHub — Multi-Vendor MERN Marketplace

A full-stack e-commerce marketplace where:
- **Buyers** browse and purchase products, pay via Razorpay test-mode checkout (falls back to a
  mock "Pay Now" if Razorpay isn't configured), choose a delivery type and preferred delivery date,
  earn **SuperCoins** on delivered orders and redeem them for a discount at checkout, earn lottery
  entries on qualifying orders, save items to a wishlist, leave verified-purchase reviews, and chat
  with an AI shopping assistant.
- **Sellers** register with full business details (phone, address, GST, category), get approved by
  an admin, then list their own products (photos uploaded directly from their device via
  Cloudinary) — products go live immediately once the seller is approved, with no separate
  per-product review. They get a revenue
  report (dashboard + downloadable CSV), an order-status board where they can also accept or
  reject a buyer's requested delivery date, a coupon manager, a buyer-lottery panel, low-stock
  alerts, and an AI assistant that answers questions using their real sales data.
- **Admins** approve/reject seller *accounts* (reviewing their submitted business details) and can
  remove any product or any account from the platform at any time, but no longer approve products
  one by one.

## Tech Stack
- Backend: Node.js, Express, MongoDB (Mongoose), JWT auth (httpOnly cookies), Cloudinary (image
  hosting), Google Gemini (AI assistant)
- Frontend: React (Vite), Tailwind CSS (via CDN), React Router, Axios, Recharts

## Project Structure
```
mern-marketplace/
  backend/     -> Express API + MongoDB models
  frontend/    -> React app (Vite)
```

## Features

| Feature | Where | Notes |
|---|---|---|
| Buyer/seller/admin roles + approval workflow | (original) | Sellers register with business details (phone, address, GST, category) and need admin sign-off; once approved, their products go live instantly — no per-product review |
| Admin moderation | Admin Panel → All Products / All Users | Admin can remove any product or any account (accounts cascade-delete that seller's products) at any time, in addition to the seller approval queue |
| **SuperCoins reward wallet** | Navbar balance · redeemed at Checkout · earned on delivery | Buyers earn a % (default 2%, `SUPERCOIN_EARN_RATE`) of a delivered order's total as coins (1 coin = ₹1); redeemable at checkout up to 50% of an order |
| **Delivery type & date scheduling** | Checkout (buyer picks) · Seller Dashboard → Orders tab (seller accepts/suggests new date) | Standard or Express, plus a preferred delivery date the seller confirms or pushes back on with a note |
| **Product image upload** | Seller Dashboard → Products → Add/Edit | Real file picker (JPG/PNG/WEBP/GIF, 5MB max) uploaded straight to Cloudinary — no more pasting image URLs |
| **Quantity spin rewards** | Seller Dashboard → Rewards tab · revealed at Checkout | Seller sets "buy X+ of product Y → Z bonus coins"; buyer sees a spin-wheel animation at checkout, but the prize is fixed by the rule, never random |
| Reviews & ratings | Product page | Only buyers with a **paid order** containing the product can review it; product rating auto-recalculates |
| Wishlist | Navbar → Wishlist | Heart icon on any product card/page |
| Order status tracking | Buyer: Orders page · Seller: Dashboard → Orders tab | Processing → Shipped → Out for Delivery → Delivered/Cancelled |
| Low-stock alerts | Seller Dashboard → Products tab | Red banner once stock ≤ the threshold you set per product |
| Coupons | Seller Dashboard → Coupons tab · applied at Checkout | % discount, optional minimum order amount, optional expiry |
| Buyer lottery | Seller Dashboard → Lottery tab | Seller sets a "spend above ₹X" threshold; qualifying buyers get an entry when their order is paid; seller/admin triggers a random draw manually |
| Revenue report | Seller Dashboard → Revenue Report tab | Totals, top products, a day-by-day chart, and a CSV download for accounting |
| AI assistant | Floating chat button (bottom-right), any logged-in user | Buyers get a shopping assistant grounded in the live catalog; sellers get an insights assistant grounded in their own sales data. Powered by Google **Gemini** |
| Real payment checkout | Checkout page | Razorpay **test mode** — a real checkout popup, test cards only, no money moves |

## Setup

### 1. Backend
```
cd backend
npm install
```
Copy `.env.example` to `.env` (or use the `.env` already filled in with your Mongo URI/JWT secret)
and fill in:
```
MONGO_URI=mongodb://localhost:27017/marketplace   (or your Atlas URI)
JWT_SECRET=anyRandomLongString
```

Everything below is **optional** — the app works without them, just with those features gracefully
turned off (mock payment button, "assistant not configured yet" message, "upload not configured"
message):

**AI assistant (free, no card needed):**
1. Sign up at https://aistudio.google.com/app/apikey
2. Create an API key (it should look like `AIzaSy...`)
3. Add to `.env`:
   ```
   GEMINI_API_KEY=your_key_here
   GEMINI_MODEL=gemini-2.5-flash
   ```

**Product image uploads (free, no card needed):**
1. Sign up at https://cloudinary.com
2. Your Dashboard's home page shows **Cloud Name**, **API Key** and **API Secret**
3. Add to `.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

**SuperCoins earn rate (optional — defaults to 2%):**
```
SUPERCOIN_EARN_RATE=0.02
```

**Real payment checkout (free test mode, no PAN/KYC needed):**
1. Sign up at https://dashboard.razorpay.com/signup with just an email/phone — skip KYC entirely
2. Dashboard → Settings → API Keys → **Generate Test Key**
3. Add to `.env`:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
   (KYC/PAN is only needed later, to switch these to live keys and receive real money.)

Then seed demo data and start the server:
```
npm run data:import
npm run server
```
Backend runs at http://localhost:5000

### 2. Frontend
In a new terminal:
```
cd frontend
npm install
npm run dev
```
Frontend runs at http://localhost:5173

## Demo Accounts (created by the seeder)
| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | admin@example.com | admin123 | Full access |
| Seller (approved) | seller1@example.com | seller123 | Already approved, has live products |
| Seller (pending) | seller2@example.com | seller123 | Account not approved yet — log in as admin to approve |
| Buyer | buyer@example.com | buyer123 | Can browse, buy, check order history |

## Demo Flow (for your project presentation)
1. Log in as **buyer**, browse products, add to cart. At Checkout, pick a delivery type (Standard/
   Express) and a preferred delivery date, apply a coupon if the seller made one, and pay — with
   Razorpay configured, use test card `4111 1111 1111 1111`, any future expiry, any CVV; otherwise
   click "Pay Now (Mock Payment)".
2. As the seller, go to Dashboard → **Orders** tab — accept the buyer's requested delivery date (or
   suggest a new one with a note), then mark the order **Delivered**. This credits the buyer's
   SuperCoins balance automatically.
3. As the buyer, check the Navbar — your 🪙 SuperCoins balance is updated. Add more items to the
   cart and check the "Use SuperCoins" box at Checkout to redeem them for a discount.
4. As the seller, go to Dashboard → **Lottery** tab, enable it with a threshold below what the
   buyer just spent, then place another qualifying order as the buyer — an entry appears in the
   seller's pool. Click "Draw a Winner".
5. As the buyer, go to the product page for something you bought and leave a review.
6. As the seller, add a new product and try the **image upload** — pick a file from your device
   instead of pasting a URL.
7. As the seller, check Dashboard → **Revenue Report** for the chart and download the CSV.
8. Try the AI assistant (bottom-right chat bubble) as both a buyer and a seller — notice the
   different tone and grounding.
9. Log out, register a **new seller** account with the expanded business-details form — notice
   it's stuck on "pending approval" and can't log in yet.
10. Log in as **admin**, go to Admin Panel → Pending Sellers, review the submitted phone/address/
    GST/category details, and approve the new seller. Log back in as that seller and add a
    product — it appears on the storefront immediately, with no separate product-approval step.
11. Back in the Admin Panel, try All Products → Remove on a listing, and All Users → Remove on an
    account, to see the admin's moderation powers.

## Notes
- Product images are uploaded directly from the seller's device to Cloudinary — no URL pasting
  needed. Without Cloudinary keys configured, uploads return a clear "not configured yet" error.
- SuperCoins: buyers earn `SUPERCOIN_EARN_RATE` (default 2%) of a delivered order's total as coins,
  and can redeem coins for up to 50% of an order's total at checkout (1 coin = ₹1). Coins are
  deducted from the buyer's balance the moment an order with redemption is placed, and credited the
  moment a paid order is marked Delivered.
- Delivery requests don't block or cancel an order — a seller "rejecting" a date is really "please
  pick a different one"; the buyer sees the seller's note on their Orders page and can place a new
  order with a different date if needed.
- The AI assistant, Razorpay checkout, and Cloudinary uploads all degrade gracefully if their
  `.env` keys are left blank — nothing breaks, those features just tell the user they're not
  configured yet.
- To deploy: host `backend` (Render/Railway) and `frontend` (Vercel/Netlify) separately, set
  `CLIENT_URL` in the backend `.env` to your deployed frontend URL, add all the same env vars
  (Mongo, JWT, Gemini, Cloudinary, Razorpay) on your host's dashboard, and update
  `frontend/src/api/axios.js`'s `baseURL` to your deployed backend URL.
"# Mini-shop" 
