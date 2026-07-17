# BharatSales AI

**Field Sales Automation & Distributor Management SaaS for Indian Businesses**

Plan every visit, verify every activity, capture every order, manage every distributor and convert field activity into measurable sales growth.

---

## 🚀 Quick Start

### Using Docker (Production Deployment)
```bash
# 1. Start all services (MongoDB, NestJS API, Next.js Web)
docker-compose up --build -d

# ⚠️ Note: If you encounter a Docker network glitch (e.g. "endpoint with name bharatsales-mongo already exists"),
# run the following cleanup commands, and then retry `docker-compose up -d`:
# docker network disconnect -f bharatsales-ai2_default bharatsales-mongodb 2>/dev/null || true
# docker network rm bharatsales-ai2_default 2>/dev/null || true
```

### Seeding the Database (First-time setup)
When running the fresh Docker environment, your MongoDB database is empty. You must seed it to create the default admin account. Since the production API Docker image strips out the source code, run this directly from your host machine terminal:
```bash
# 2. Navigate to the API app and seed the database
cd apps/api
export MONGODB_URI=mongodb://localhost:27017/bharatsales
pnpm run seed
```

### Accessing the Platform
- **Web Dashboard:** [http://localhost:6003](http://localhost:6003)
- **API Endpoint:**  [http://localhost:6002](http://localhost:6002)
- **API Docs (Swagger):** [http://localhost:6002/api/docs](http://localhost:6002/api/docs)
- **Health Check:**  [http://localhost:6002/health](http://localhost:6002/health)

### Local Development
```bash
# 1. Install dependencies
pnpm install

# 2. Start MongoDB (via Docker)
docker-compose up -d mongo

# 3. Seed the database
cd apps/api && pnpm run seed

# 4. Start API (terminal 1)
cd apps/api && pnpm run dev

# 5. Start Web (terminal 2)
cd apps/web && pnpm run dev

# 6. Start Field PWA (terminal 3)
cd apps/field-pwa && pnpm run dev
```

### Running Tests
```bash
# Make sure MongoDB is running first, then seed the database:
cd apps/api && pnpm run seed

# Then run the full E2E test suite:
cd apps/api && npx jest src/uat.spec.ts

# All 23 tests across 5 phases should pass.
```

---

## 🏗️ Architecture

```
bharatsales-ai/
├── apps/
│   ├── web/          # Next.js 14 - Admin, Manager & Distributor portals
│   ├── field-pwa/    # React PWA - Sales rep mobile offline-first app
│   └── api/          # NestJS - Backend API (Port 6002)
├── packages/
│   ├── ui/           # Shared UI components
│   ├── shared-types/ # TypeScript types
│   ├── validation/   # Zod schemas
│   ├── permissions/  # RBAC logic (11 roles)
│   ├── business-rules/ # Core business rule calculations
│   └── api-client/   # API client SDK
├── infra/
│   ├── docker/       # Docker configs
│   └── scripts/      # Utility scripts
├── .github/
│   └── workflows/
│       └── deploy.yml  # CI/CD pipeline (lint, test, build)
└── docs/             # Documentation
```

---

## 🎯 Features

- **Smart Beat Planning** – Route optimization for maximum outlet coverage
- **Geofenced Visits** – GPS-verified check-ins with real-time trust signals
- **Order Engine** – Integrated cart, credit checks, targets & multi-level approvals
- **Distributor Management** – Inventory ledger, dispatch tracking, returns
- **Finance & Collections** – Net-15 invoicing, payments, credit limits
- **Real-Time Dashboards** – MongoDB aggregation pipelines for live KPIs
- **Offline-First PWA** – Dexie.js + Background Sync for zero-connectivity orders
- **Multi-Tenant Isolation** – Complete data isolation across organizations via JWT `orgId`
- 🤖 **AI Insights** – Churn risk detection, sales forecasting, ERP integrations
- 📊 **Analytics** – Full enterprise analytics dashboard with secure tenant scoping
- 📥 **Bulk Imports** – CSV import for Products, Outlets, Users, Targets

---

## 👥 Demo Accounts

Run `pnpm run seed` in `apps/api` first, then use:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@fmcgcorp.com | password123 |

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | NestJS + TypeScript |
| Database | MongoDB 6 (Mongoose) |
| Auth | JWT (RS256 / HS256) + RBAC (11 roles) |
| Validation | Zod + class-validator + NestJS ValidationPipe |
| Rate Limiting | @nestjs/throttler (100 req/min/IP) |
| Compression | gzip via `compression` middleware |
| Health Checks | @nestjs/terminus at `/health` |
| API Docs | Swagger UI at `/api/docs` |
| Frontend | Next.js 14, Tailwind CSS |
| Mobile PWA | Vite + React + Dexie.js (IndexedDB) |
| AI Integration | OpenAI GPT-4o with algorithmic fallback |
| Infra | Turborepo, Docker Compose, GitHub Actions |

---

## 🔒 Security

- **Multi-tenant isolation**: `orgId` extracted exclusively from server-side JWT — never trusted from client
- **JWT authentication** with role and permission guards on every route
- **Role-based access control** — 11 roles (Super Admin → Sales Rep)
- **Audit logging** — all mutations are tracked via `AuditInterceptor`
- **Rate limiting** — 100 requests per minute per IP
- **Global ValidationPipe** — `whitelist: true`, strips unknown fields, prevents over-posting
- **Helmet** — security HTTP headers
- **CORS** configured for known origins only

---

## 🚢 Deployment

### Docker Production Deploy
```bash
# Build and start all services
docker-compose up --build -d

# Check health
curl http://localhost:6002/health
# Expected: { "status": "ok", "info": { "mongodb": { "status": "up" } } }

# View API documentation
open http://localhost:6002/api/docs
```

### Environment Variables
Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Key variables:
| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/bharatsales` |
| `JWT_SECRET` | JWT signing secret (min 32 chars) | Required |
| `PORT` | API server port | `6002` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `OPENAI_API_KEY` | OpenAI key for AI features | Optional |

### Rollback
```bash
# Stop and remove current containers
docker-compose down

# Redeploy previous image
git checkout <previous-commit>
docker-compose up --build -d
```

---

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [ERD](docs/ERD.md)
- [API Contract](docs/API_CONTRACT.md)
- [Permission Matrix](docs/PERMISSION_MATRIX.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Offline Sync](docs/OFFLINE_SYNC.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)

---

## 📈 Target Industries

- FMCG (Fast-Moving Consumer Goods)
- Pharmaceutical
- Consumer Goods
- Paint & Building Materials
- Agri Inputs

## 📄 License

Proprietary — All rights reserved

---

Built with ❤️ for Indian Distribution
