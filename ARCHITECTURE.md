# ARCHITECTURE.md — System Architecture & Design Specification

## 1. Executive Summary

Electricity Bazaar is architected as a modern, decoupled B2B multi-tenant web application. It enforces strict separation of concerns, organisation-level multi-tenancy, deterministic matching algorithms, and auditable verification workflows.

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React 18 + TypeScript + Vite + Tailwind CSS (Responsive Desktop / Tablet / Mobile)|
+-----------------------------------------+-----------------------------------------+
                                          |
                                   HTTPS / REST API
                                          |
+-----------------------------------------v-----------------------------------------+
|                               API GATEWAY / SERVER                                |
|             Node.js + TypeScript (Express / Fastify) on Railway                   |
|                                                                                   |
|  [Security & Rate Limiting] --> [JWT Auth & Session] --> [Org-Tenant Context]     |
|  [Zod Input Validation]    --> [Role-Based Access Control]                        |
|                                                                                   |
|  Modules:                                                                         |
|  ├── Auth & Users          ├── Marketplace Listings      ├── Matching Engine      |
|  ├── Organisations         ├── Buyer Requirements        ├── Bill Diagnostics     |
|  ├── Enquiries & Comms     ├── Storage & Tenders         ├── Economics Calculator |
|  ├── Audit Logger          ├── Document Metadata Mgr     ├── Regulatory Engine    |
|  └── Admin & Moderation    ├── Comparison Workspace      ├── Telangana Pilot Pack |
+--------------------+------------------------------------+-------------------------+
                     |                                    |
          Prisma Client (Typed ORM)                 Presigned S3 / Cloud Storage
                     |                                    |
+--------------------v-------------+             +--------v-------------------------+
|          DATABASE LAYER          |             |       OBJECT STORAGE             |
|   PostgreSQL 15+ (Hosted Railway)|             |  Private S3-compatible bucket    |
|   - Multi-tenant schemas/tables  |             |  - Encrypted at rest (AES-256)   |
|   - Foreign key constraints      |             |  - Short-lived presigned URLs    |
|   - B-tree & GIN indices         |             +----------------------------------+
+----------------------------------+
```

---

## 2. Component Architecture

### 2.1 Frontend Tier (`frontend/`)
- **Framework**: React 18 with TypeScript, bundled via Vite.
- **Styling**: Tailwind CSS with custom design tokens representing the Electricity Bazaar palette:
  - Deep Navy Blue (`#0A192F`, `#1E3A8A`) for trust, institution, and authority.
  - Emerald / Teal Green (`#0D9488`, `#10B981`) for renewable energy, sustainability, and positive savings.
  - Amber (`#D97706`, `#F59E0B`) for pending approvals, regulatory notices, and draft states.
  - Slate Grey & Crisp White for high-density, accessible C&I enterprise data grids.
- **State & Data Fetching**: React Context for Auth & Organization sessions; custom typed API client (`fetch` wrapper with automatic token injection and refresh handling).
- **Charts & Visualization**: Recharts for generation load curves (Solar diurnal bell curve, Wind nighttime peaks, RTC baseload) and tariff sensitivity charts.
- **Component Design**: Headless, accessible primitives with accessible keyboard navigation and mobile-first responsiveness.

### 2.2 Backend Tier (`backend/`)
- **Runtime & Language**: Node.js (LTS), TypeScript with strict mode enabled.
- **Framework**: Express.js (or Fastify) with modular controller-service-repository patterns.
- **Validation**: Zod schemas for all inbound DTOs, query params, and environment variables.
- **ORM & Data Access**: Prisma ORM with strongly-typed client generation and automated database migrations.
- **Logging & Observability**: Structured JSON logging (Pino / Winston) capturing correlation IDs, execution durations, and HTTP status codes.

### 2.3 Persistence & Storage Tier
- **Primary Database**: PostgreSQL 15+ hosted on Railway.
- **Document Storage**: S3-compatible private object store. Documents (grid connectivity approvals, audited financial net worth certificates, SLDC connectivity letters) are stored with randomized keys and never exposed via public buckets. Download access requires an authenticated session and generates a short-lived (15-minute) presigned URL after verifying tenant authorization.

---

## 3. Security & Access Control Architecture

### 3.1 Authentication & Session Management
- **Credentials**: Passwords salted and hashed with Argon2id or bcrypt (cost factor >= 12).
- **Tokens**: Stateless, cryptographically signed JWT access tokens (15-minute validity) accompanied by rotatable, httpOnly, secure refresh tokens stored in database sessions.
- **Password Recovery**: Secure, one-time cryptographically random tokens hashed at rest with 1-hour expiry.

### 3.2 Multi-Tenant Data Isolation
- Every user belongs to one or more **Organisations** via an `OrganisationMembership` join model.
- Each operational entity (Buyer Requirement, Marketplace Listing, Document, Enquiry) is strictly scoped to an `organisationId`.
- Server-side middleware attaches the active `TenantContext` to every request. 
- All database queries for tenant-scoped resources strictly filter on `WHERE organisationId = req.tenant.organisationId`. Cross-tenant queries are blocked at the ORM layer.

### 3.3 Role-Based Access Control (RBAC)
User roles are hierarchically segmented:

| Role | Scope | Permitted Actions |
| :--- | :--- | :--- |
| **BUYER_USER** | Organisation | View public marketplace, submit private power requirements, run calculations, save listings, submit seller enquiries, view responses. |
| **BUYER_ADMIN** | Organisation | All BUYER_USER actions + manage organization profile, invite team members, manage multi-facility load points. |
| **SELLER_USER** | Organisation | View public marketplace, create and draft power supply/asset listings, upload technical documents, respond to enquiries. |
| **SELLER_ADMIN** | Organisation | All SELLER_USER actions + submit listings for verification, manage seller profile, manage billing/subscriptions. |
| **SERVICE_PROVIDER** | Organisation | Create energy advisory / EPC / testing service listings, receive service RFQs. |
| **VERIFICATION_OFFICER** | System-Wide | Review submitted seller credentials, verify regulatory approvals, approve/reject listing badges with audit notes. |
| **PLATFORM_ADMIN** | System-Wide | Full administrative visibility, user lifecycle management, category configuration, dispute moderation, system audit logs. |

---

## 4. Regulatory Boundaries & Compliance Model

India's power sector is governed under a rigorous federal legal framework. Electricity Bazaar explicitly embeds the following regulatory boundaries:

1. **Electricity Act 2003 Compliance**:
   - The platform strictly acts as an information exchange and matchmaking venue under Section 79/86 principles.
   - It **does not** act as a power trader (Section 14(c)), does not collect trading margins, does not maintain trading capital adequacy, and does not schedule power on SLDC/RLDC grids.
2. **Electricity Rules 2005 (Rule 3 - Captive Status Verification)**:
   - For Group Captive listings, the platform mandates disclosure of whether the project is structured to meet the 26% equity ownership and 51% proportional consumption statutory rules. Listings declare their captive structure clearly without the platform certifying legal captive compliance.
3. **Green Energy Open Access Rules (GEOAR 2022 / 2023 Amendments)**:
   - Sanctioned load threshold recognition (e.g., 100 kW minimum limit for Green Energy Open Access).
   - Clear distinction between Inter-State (CTU) and Intra-State (STU) transmission connectivity.
4. **Data Privacy & Disclaimers**:
   - Buyer confidential load profiles, contract demand figures, and landed tariff benchmarks are **never** made public. They are shared with eligible suppliers solely upon explicit buyer consent during an enquiry workflow.

---

## 5. Deployment Topology & Environments

### 5.1 Staging & Production Targets
- **Frontend SPA**: Netlify
  - Automated continuous deployment from Git main/release branches.
  - SPA routing rewrite rules configured via `_redirects` (`/* /index.html 200`).
  - Security headers configured (`Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`).
- **Backend API & Database**: Railway
  - Dockerized Node.js environment with multi-stage build.
  - Managed PostgreSQL instance with automated daily snapshots and point-in-time recovery.
  - Secret variables managed securely in Railway environment vault.

### 5.2 Environment Variables Scheme
All configurations are injected via environment variables:

| Variable | Target | Purpose |
| :--- | :--- | :--- |
| `NODE_ENV` | Backend | `development`, `test`, `production` |
| `PORT` | Backend | Port number (e.g. `5000` or Railway dynamic `$PORT`) |
| `DATABASE_URL` | Backend | PostgreSQL connection string |
| `JWT_SECRET` | Backend | Cryptographic signing secret for JWT access tokens |
| `JWT_REFRESH_SECRET` | Backend | Cryptographic signing secret for refresh tokens |
| `CORS_ORIGIN` | Backend | Whitelisted frontend origin URL(s) |
| `VITE_API_URL` | Frontend | Base URL of the backend API (e.g. `https://api.electricitybazaar.in/api/v1`) |

---

## 6. Architectural Decision Records (ADRs)

- **ADR-001: Monorepo vs Multi-repo**: Adopted a clean monorepo with top-level `frontend/` and `backend/` directories to simplify shared TypeScript interfaces, maintain atomic commits, and enable unified CI/CD pipelines.
- **ADR-002: Deterministic vs AI-based Matching**: Matching in Phase 1 is strictly deterministic based on rule criteria (Capacity fit, Location, Interconnection, Green Share, Tenure) to guarantee commercial transparency and eliminate black-box hallucinations.
- **ADR-003: Landed-Cost Calculation Engine**: Built as a pure functional module with zero side effects, independently unit-tested with 100% boundary test coverage for all tariff, surcharge, and loss vectors.
- **ADR-004: Bill-to-Procurement Intelligence Pipeline**: Rather than operating an isolated calculator, bill diagnostic inputs directly parameterize the procurement requirement and query the active supplier inventory, benchmarking against verified state tariff orders (piloting with Telangana TSERC TSSPDCL/TGNPDCL HT-I/HT-II tariffs).

---

## 7. The 4-Stage Bill-to-Procurement Pipeline

1. **Stage 1 (Bill Diagnostics)**: Industrial consumer inputs DISCOM (e.g. TSSPDCL), voltage (11/33/132 kV), CMD (kVA), monthly units, energy charge, and demand charge. Derives true landed utility cost (e.g. ₹8.85/kWh).
2. **Stage 2 (Landed Cost Engine)**: Evaluates Third-Party Open Access (with CSS, AS, wheeling, losses) vs Group Captive (0 CSS, 0 AS). Computes net potential savings.
3. **Stage 3 (Supplier Matching)**: Instant query against active verified listings matching state, capacity, and technology.
4. **Stage 4 (Comparison & Negotiation)**: Side-by-side comparison matrix and confidential enquiry initiation.

