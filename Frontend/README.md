

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# CRM LeadBase — Leads Management System

A production-grade CRM module built with the MERN stack, designed for performance at scale (10,000+ records). Every architectural decision prioritizes efficiency, maintainability, and real-world usability.

---

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local or Atlas)
- npm or yarn

### 1. Clone & Install

```bash
# Backend
cd backend
npm install
cp .env.example .env   # Edit MONGODB_URI

# Frontend
cd ../frontend
npm install
cp .env.example .env
```

### 2. Seed the Database (12,000 leads + demo users)

```bash
cd backend
npm run seed
```

**Demo accounts created:**
| Role    | Email            | Password   |
|---------|-----------------|------------|
| Admin   | admin@crm.com   | Admin@123  |
| Manager | alice@crm.com   | Sales@123  |
| Sales   | bob@crm.com     | Sales@123  |

### 3. Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open `http://localhost:5173` → log in with any demo account.

---

## Architecture Overview

```
crm-leads/
├── backend/
│   └── src/
│       ├── config/       # MongoDB connection
│       ├── controllers/  # Request handlers (leadsController, authController)
│       ├── middleware/   # JWT protect + RBAC restrictTo
│       ├── models/       # Lead (with indexes), User
│       ├── routes/       # Express routers
│       └── utils/        # cache.js, response.js, seed.js
└── frontend/
    └── src/
        ├── components/
        │   ├── leads/    # LeadsTable, LeadsFilters, StatsCards
        │   ├── search/   # GlobalSearch
        │   └── ui/       # StatusBadge, Pagination
        ├── hooks/        # useLeads (React Query), useDebounce
        ├── pages/        # LoginPage, LeadsPage (lazy-loaded)
        ├── store/        # authStore, leadsStore (Zustand)
        └── utils/        # apiClient (Axios), queryClient
```

---

## Performance Optimizations

### Backend

#### 1. MongoDB Indexes
```js
// Compound indexes match the most common query patterns
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ owner: 1, createdAt: -1 });
leadSchema.index({ status: 1, owner: 1, createdAt: -1 });

// Text index with field weighting for search relevance
leadSchema.index(
  { name: 'text', email: 'text', company: 'text' },
  { weights: { name: 3, email: 2, company: 1 } }
);
```
Without these, every query on 12,000+ docs would be a full collection scan.

#### 2. Aggregation Pipeline with `$facet`
Instead of two round-trips (one for data, one for count), a single `$facet` call returns both in one query:
```js
{
  $facet: {
    data: [ $sort, $skip, $limit, $project ],  // only needed fields
    totalCount: [ { $count: 'count' } ]
  }
}
```

#### 3. In-Memory Cache (`node-cache`)
- **List queries**: cached 60 seconds — prevents redundant aggregation on rapid navigation
- **Search results**: cached 30 seconds — debouncing is the first defense; cache is the second
- **Stats / Owners**: cached 2 minutes — essentially static between writes
- **Cache invalidation**: all `leads:*` keys bust on any create/update/delete

#### 4. Field Projection
The `$project` stage in aggregation returns only the 6 columns the table needs, not the full document (notes, phone, source are excluded). Reduces payload ~40%.

#### 5. Connection Pooling
```js
mongoose.connect(uri, { maxPoolSize: 10 })
```
Reuses existing connections instead of opening a new one per request.

#### 6. Gzip Compression
`compression()` middleware compresses all API responses. At 25 records/page with all fields, responses compress from ~8KB to ~2KB.

#### 7. Rate Limiting
- General API: 500 req / 15 min
- Search endpoint: 60 req / min
Prevents abuse and protects DB from runaway clients.

---

### Frontend

#### 1. Server-Side Everything
Pagination, sorting, filtering, and search all go to the server. The browser never holds more than one page of data at a time — no virtualisation libraries needed because we never render thousands of rows.

#### 2. React Query (`@tanstack/react-query`)
- **`placeholderData: (prev) => prev`**: Previous page data stays visible while the next page loads → no layout shift or blank flash
- **`staleTime: 30_000`**: Data is considered fresh for 30s, preventing redundant refetches on tab switch or component remount
- **Hierarchical query keys**: `['leads', 'list', { page, limit, ... }]` — precise cache invalidation without over-invalidating

#### 3. Zustand (not Context)
Using React Context for frequently-updated state (filter changes, pagination clicks) triggers re-renders in every consumer. Zustand's selector-based subscriptions ensure only components that depend on the changed slice re-render:
```js
// This component ONLY re-renders when `page` changes
const page = useLeadsStore((s) => s.page);
```

#### 4. Debounced Search
`useDebounce(input, 300)` for global search, `useDebounce(input, 400)` for table filter — two separate timers with different delays. At 60 WPM (5 chars/sec), debouncing saves ~85% of potential search API calls.

#### 5. `memo()` Everywhere
All leaf components (`StatusBadge`, `Pagination`, `LeadsFilters`, `StatsCards`) are wrapped in `React.memo`, preventing re-renders when parent state changes but their props haven't.

#### 6. Code Splitting + Lazy Loading
```js
const LeadsTable = lazy(() => import('../components/leads/LeadsTable'));
const StatsCards = lazy(() => import('../components/leads/StatsCards'));
```
Combined with Vite's manual chunk splitting:
```js
manualChunks: {
  vendor: ['react', 'react-dom', 'react-router-dom'],
  query: ['@tanstack/react-query'],
  table: ['@tanstack/react-table'],
}
```
Initial bundle is small; table and chart logic only load when needed.

#### 7. Skeleton Loading (not Spinners)
Skeleton rows maintain layout during loads, reducing Cumulative Layout Shift (CLS) and perceived latency. The loading bar above the table indicates background fetches without unmounting the existing data.

#### 8. Stable Column Definitions
TanStack Table column defs are defined with `useMemo([], [])` — empty dependency array because all dynamic behavior (sorting UI) is handled via Zustand state, not column recreation.

---

## API Reference

All endpoints require `Authorization: Bearer <token>` header except `/api/auth/*`.

### Auth
| Method | Endpoint           | Description     |
|--------|--------------------|-----------------|
| POST   | /api/auth/login    | Login           |
| POST   | /api/auth/register | Register        |
| GET    | /api/auth/me       | Current user    |

### Leads
| Method | Endpoint             | Access         | Description                |
|--------|---------------------|----------------|----------------------------|
| GET    | /api/leads          | All            | Paginated list             |
| POST   | /api/leads          | Admin/Manager  | Create lead                |
| GET    | /api/leads/:id      | All            | Single lead                |
| PATCH  | /api/leads/:id      | Admin/Manager  | Update lead                |
| DELETE | /api/leads/:id      | Admin only     | Delete lead                |
| GET    | /api/leads/search   | All            | Global search (q, limit)   |
| GET    | /api/leads/owners   | All            | Distinct owner names       |
| GET    | /api/leads/stats    | All            | Count by status            |

### Query Parameters (GET /api/leads)
| Param      | Type   | Default    | Description                                   |
|------------|--------|------------|-----------------------------------------------|
| page       | number | 1          | Page number                                   |
| limit      | number | 25         | Records per page (max 100)                    |
| sortField  | string | createdAt  | name/email/company/status/owner/createdAt      |
| sortOrder  | string | desc       | asc or desc                                   |
| status     | string | —          | Filter by status                              |
| owner      | string | —          | Filter by owner (case-insensitive)            |
| search     | string | —          | Full-text search on name, email, company      |

---

## Role-Based Access Control

| Action         | Sales | Manager | Admin |
|---------------|-------|---------|-------|
| View leads    | ✓     | ✓       | ✓     |
| Create lead   | ✗     | ✓       | ✓     |
| Update lead   | ✗     | ✓       | ✓     |
| Delete lead   | ✗     | ✗       | ✓     |

---

## Tech Stack

| Layer     | Technology                                   | Reason                                      |
|-----------|----------------------------------------------|---------------------------------------------|
| Backend   | Node.js + Express                            | Lightweight, async I/O                      |
| Database  | MongoDB + Mongoose                           | Flexible schema, aggregation pipeline       |
| Auth      | JWT + bcryptjs                               | Stateless, scalable                         |
| Cache     | node-cache                                   | Zero-infrastructure in-process cache        |
| Frontend  | React 18 + Vite                              | Fast HMR, modern build tooling              |
| State     | Zustand                                      | Minimal, selector-based, no re-render traps |
| Queries   | TanStack Query v5                            | Caching, deduplication, background refetch  |
| Table     | TanStack Table v8                            | Headless, full control, zero bundle bloat   |
| Routing   | React Router v6                              | File-based lazy loading                     |

---

## Assumptions

1. **Search uses MongoDB Text Index** — requires MongoDB 4.0+. If using Atlas, text search is automatically available.
2. **No real-time updates** — leads are fetched on navigation; no WebSocket push.
3. **Single-tenant** — one database per deployment. Multi-tenancy would add a `tenantId` field and index.
4. **node-cache is sufficient** — for a single-server deployment. In a multi-instance setup (load balanced), replace with Redis (`ioredis`) and swap the `withCache` implementation.
5. **12,000 records are seeded** — more than the 10,000 minimum, representing ~2 years of typical sales activity.

---

## Potential Improvements (out of scope)

- **Redis cache** — drop-in replacement for `node-cache` in multi-instance deployments
- **Elasticsearch** — for fuzzy/typo-tolerant search at 1M+ records
- **Cursor-based pagination** — for very deep pages where `$skip` becomes expensive
- **WebSockets (Socket.io)** — real-time table updates when teammates add leads
- **Virtual scrolling** — if page sizes ever exceed 200+ rows
- **React Query Optimistic Updates** — instant UI feedback on mutations