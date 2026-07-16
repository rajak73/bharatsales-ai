# BharatSales AI

**Field Sales Automation & Distributor Management SaaS for Indian Businesses**

Plan every visit, verify every activity, capture every order, manage every distributor and convert field activity into measurable sales growth.

## 🚀 Quick Start

# Using Docker (Recommended)
```bash
# Start all services (MongoDB, NestJS API, Next.js Web)
docker-compose up --build -d

# Access:
# Web Dashboard: http://localhost:6003
# API Endpoint: http://localhost:6002/api/v1
```

### Local Development
```bash
# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d mongodb redis minio

# Initialize MongoDB replica set
docker-compose up mongo-init

# Start API (terminal 1)
cd apps/api && pnpm run start:dev

# Start Web (terminal 2)  
cd apps/web && pnpm run dev

# Start Field PWA (terminal 3)
cd apps/field-pwa && pnpm run dev
```

## 🏗️ Architecture

```
bharatsales-ai/
├── apps/
│   ├── web/          # Next.js - Public site + Admin + Manager + Distributor portals
│   ├── field-pwa/    # React PWA - Sales rep mobile app
│   └── api/          # NestJS/Express - Backend API
├── packages/
│   ├── ui/           # Shared UI components
│   ├── shared-types/ # TypeScript types
│   ├── validation/   # Zod schemas
│   ├── permissions/  # RBAC logic
│   ├── business-rules/ # Core calculations
│   └── api-client/   # API client SDK
├── infra/
│   ├── docker/       # Docker configs
│   └── scripts/      # Utility scripts
└── docs/             # Documentation
```

## 🎯 Features

- **Smart Beat Planning** - Route optimization for maximum coverage
- **Geofenced Visits** - GPS verification with trust signals via Geolocation API
- **Order Engine** - Integrated cart, targets, and approvals
- **Distributor Management** - Inventory ledger, dispatch tracking
- **Finance & Collections** - Dynamic Net-15 invoicing, payments, credit limits
- **Real-Time Dashboards** - Live MongoDB Aggregations for KPIs and analytics
- **Offline-First PWA** - Dexie.js + Background Sync engine for Zero-Connectivity orders
- **Multi-Tenant** - Complete data isolation across organizations
- 🤖 **AI Assistant** - Floating Web Chatbot for insights, churn risk, and sales forecasting
- 🎤 **AI Voice-to-Order** - Speak natural language into the Field PWA to instantly populate the cart

## 👥 Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bharatsales.ai | admin123 |
| Manager | manager@bharatsales.ai | manager123 |
| Sales Rep | rep@bharatsales.ai | rep123 |

## 📊 Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, TypeScript
- **Mobile PWA**: Vite, React, Dexie.js (IndexedDB)
- **Backend**: NestJS, TypeScript, Axios
- **Database**: MongoDB (Mongoose)
- **AI Integration**: OpenAI (GPT-4o) with graceful fallback algorithms
- **Infrastructure**: Turborepo, Docker Compose, GitHub Actions, AWS EC2 ready

## 📖 Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [ERD](docs/ERD.md)
- [API Contract](docs/API_CONTRACT.md)
- [Permission Matrix](docs/PERMISSION_MATRIX.md)
- [Business Rules](docs/BUSINESS_RULES.md)
- [Offline Sync](docs/OFFLINE_SYNC.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)

## 🔒 Security

- Multi-tenant data isolation
- JWT authentication with refresh rotation
- Role-based access control (11 roles)
- OWASP-aligned development
- Audit logging for all mutations
- Rate limiting and account lockout

## 📈 Target Industries

- FMCG (Fast-Moving Consumer Goods)
- Pharmaceutical
- Consumer Goods
- Paint & Building Materials
- Agri Inputs

## 📄 License

Proprietary - All rights reserved

---

Built with ❤️ for Indian Distribution
