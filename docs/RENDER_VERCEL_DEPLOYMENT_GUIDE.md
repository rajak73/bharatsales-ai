# Modern Serverless Deployment Strategy

Based on your preferred stack, you are moving away from traditional EC2 instances towards a modern, globally distributed serverless architecture. 

Here is exactly how you deploy each component and the specific Environment Variables (APIs) you must configure on each platform.

## 1. Database & Cache (The Backbone)
### MongoDB Atlas (Database)
- **Action**: Create a new Project and Cluster in Atlas.
- **Critical Requirement**: Deploy a **Replica Set** (M0 free tier works). BharatSales uses `session.startTransaction()` for FEFO inventory which requires a replica set.
- **Network**: Allow access from `0.0.0.0/0` (Render IPs are dynamic).

### Upstash (Redis)
- **Action**: Create a Redis database in Upstash.
- **Purpose**: Required for BullMQ to process background CSV exports asynchronously.

---

## 2. NestJS API (Backend) -> Deploy on [Render](https://render.com)
Render supports persistent Web Services for NestJS.
- **Build Command**: `pnpm install && pnpm run build --filter @bharatsales/api`
- **Start Command**: `pnpm run start --filter @bharatsales/api`

### Required Environment Variables in Render:
```env
NODE_ENV=production
PORT=6002
JWT_SECRET=your_super_long_random_jwt_secret_key

# Databases
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/bharatsales?retryWrites=true&w=majority
REDIS_HOST=your-upstash-endpoint.upstash.io
REDIS_PORT=your_upstash_port
REDIS_PASSWORD=your_upstash_password

# Integrations
OPENAI_API_KEY=sk-...
TALLY_SERVER_URL=http://your-tally-xml-endpoint
WHATSAPP_ACCESS_TOKEN=EAAB...
WHATSAPP_API_URL=https://graph.facebook.com/v17.0/YOUR_PHONE_ID/messages
```

---

## 3. "The Other Things": Media, Storage, Email, Maps, & Payments

You mentioned several incredible external services for modern apps. Here is exactly how to set them up and pass their API keys into your environments:

### 🖼️ Cloudinary (Image Hosting)
Instead of saving profile pictures or outlet shop photos to the database or local disk, you upload them to Cloudinary.
- **Where to configure**: Render (NestJS API)
- **Setup**: Sign up for Cloudinary. Get your `API Environment variable` from the dashboard.
- **API Variable**: 
  ```env
  CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
  ```
- *Usage in code*: The API will parse this URL to upload images directly and save only the secure `.jpg` URL string in MongoDB.

### 🗄️ Cloudflare R2 (CSV Exports & Large Files)
Because Vercel and Render have ephemeral file systems (files get deleted on restart), you cannot save generated CSV Exports locally. R2 is an AWS S3 compatible object storage with zero egress fees.
- **Where to configure**: Render (NestJS API)
- **Setup**: Go to Cloudflare Dashboard -> R2. Create a bucket (e.g., `bharatsales-exports`). Create an R2 API Token.
- **API Variables**:
  ```env
  R2_ACCESS_KEY_ID=your_access_key
  R2_SECRET_ACCESS_KEY=your_secret_key
  R2_BUCKET_NAME=bharatsales-exports
  R2_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com
  ```

### ✉️ Resend (Transactional Emails)
Used for sending Password Reset emails, User Invitations, and PDF Invoices.
- **Where to configure**: Render (NestJS API)
- **Setup**: Create an API Key in Resend. Verify your sending domain (e.g., `bharatsales.com`).
- **API Variable**:
  ```env
  RESEND_API_KEY=re_123456789...
  ```

### 🗺️ Leaflet + MapTiler (Live Maps)
To render the "Live Map" on the Manager Dashboard without using expensive Google Maps APIs.
- **Where to configure**: Vercel (Admin Web Dashboard)
- **Setup**: Create a MapTiler Cloud account and copy your API Key. Leaflet is the open-source UI library that will consume this key.
- **API Variable**:
  ```env
  NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key
  ```

### 💳 Razorpay Test Mode (Payments / Finance Ledger)
Used if a distributor wants to clear their outstanding balance using a Credit Card/UPI directly from the portal.
- **Where to configure**: Both Vercel (Web Dashboard UI) and Render (NestJS API validation).
- **Setup**: Generate API Keys in Test Mode from the Razorpay Dashboard.
- **API Variables (Render - API)**:
  ```env
  RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
  RAZORPAY_KEY_SECRET=YOUR_SECRET
  ```
- **API Variables (Vercel - Web)**:
  ```env
  NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_KEY
  ```

---

## 4. Admin/Manager Web & Sales Rep PWA -> Deploy on [Vercel](https://vercel.com)
Vercel is natively built for Next.js and Vite.
- **Admin Web**: Select `apps/web` as root. Build with `pnpm run build --filter @bharatsales/web`.
- **Field PWA**: Select `apps/field-pwa` as root. Build with `pnpm run build --filter @bharatsales/field-pwa`.

### Required Environment Variables in Vercel:
```env
# Render API URL
NEXT_PUBLIC_API_URL=https://your-api-name.onrender.com/api/v1
VITE_API_URL=https://your-api-name.onrender.com/api/v1

# Frontend Specific Keys
NEXT_PUBLIC_MAPTILER_API_KEY=your_maptiler_key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```
