# IMPLEMENTATION_PLAN.md — Roadmap & Phased Task Checklist

## 1. Development Principles

1. **Verify Before Proclaiming**: No feature is marked complete until its code, database migrations, API routes, frontend components, and tests pass with measurable evidence.
2. **Deterministic & Transparent**: Energy procurement calculations and matchmaking rules must be 100% deterministic, explainable, and test-covered.
3. **Data Integrity First**: No confidential buyer data (load profiles, existing tariffs) is ever exposed publicly; demo data is unmistakably flagged with `DEMO DATA — NOT A REAL OFFER`.
4. **Regulatory Honesty**: Clear disclaimers that Electricity Bazaar is an informational marketplace and discovery venue, not an authorized power exchange, trader, or scheduling authority.

---

## 2. Phased Roadmap

### Phase 1: Production-Oriented Working MVP (Immediate Focus)
- [ ] **Milestone 1.1: Workspace & Architecture Initialization**
  - Git repository initialization and `.gitignore` setup.
  - Core architecture specifications (`README.md`, `ARCHITECTURE.md`, `DATABASE_DESIGN.md`, `API_SPEC.md`, `IMPLEMENTATION_PLAN.md`).
- [ ] **Milestone 1.2: Backend Core & Database Schema**
  - Node.js + TypeScript + Express setup with modular controllers/services.
  - Prisma schema with all enums, models, indices, constraints, and audit logging.
  - Database migration script and realistic, clearly labelled seed data (`DEMO DATA — NOT A REAL OFFER`).
  - JWT authentication, password hashing, and role-based access control middleware.
  - Organization-level multi-tenancy scoping.
- [ ] **Milestone 1.3: Core REST API Implementation**
  - Auth routes (`/register`, `/login`, `/me`).
  - Public Marketplace endpoints with multi-faceted filtering, search, and sorting.
  - Buyer requirement private submission and management.
  - Seller listing creation, drafting, and document attachment.
  - Deterministic matching engine endpoint (`/requirements/:id/matches`).
  - Transparent Procurement Economics Calculator endpoint (`/calculator/evaluate`).
  - Enquiry creation and negotiation thread endpoints.
  - Admin review queue, listing moderation, and verification badge management.
- [ ] **Milestone 1.4: Frontend SPA & Design System**
  - React + TypeScript + Vite + Tailwind CSS initialization.
  - Consistent Indian energy brand system (Deep Navy `#0A192F`, Teal/Emerald `#0D9488`, Amber `#D97706`).
  - Navigation bar, footer with regulatory disclaimers, and responsive mobile drawer.
  - Public Homepage with search banner, featured listings, category cards, and "How It Works".
  - Marketplace Explorer with live tabs, multi-attribute filter sidebar, sort, and pagination.
  - Dedicated Listing Detail Page with technical specs, project stage, and enquiry modal.
  - Buyer requirement submission wizard with load profile inputs.
  - Seller listing onboarding form with technical parameter capture.
  - Interactive Procurement Economics Calculator with dynamic charts and sensitivity tables.
  - Role-based dashboards for Buyer, Seller, and Admin.
  - Regulatory, Terms, Privacy, Disclaimer, and Grievance compliance pages.
- [ ] **Milestone 1.5: End-to-End Integration & Automated Testing**
  - Unit tests for the landed-cost calculation engine (boundary checks, loss equations, zero-consumption safety).
  - Integration tests for auth, listing lifecycle, and enquiry workflows.
  - Frontend production build verification (`npm run build`).
  - Backend build verification (`npm run build`).
  - End-to-end journey validation: Buyer registers -> submits requirement -> matches listing -> sends enquiry -> Seller receives -> Admin moderates.

---

### Phase 2: Commercial Platform
- Advanced side-by-side comparison matrix (up to 5 listings).
- Supplier premium subscriptions and featured placement tier.
- Automated email notification triggers (via SendGrid / AWS SES) for enquiry updates.
- Bulk opportunity CSV import with automated validation and admin staging queue.
- Role-based PDF export for procurement economics reports.

---

### Phase 3: Market Intelligence & Enterprise
- State-wise landed-cost tariff index and historical SERC tariff order tracking.
- Enterprise multi-location facility portfolio manager for large industrial conglomerates.
- Advanced forecasting and scheduling integration hooks for captive generators.

---

## 3. Testable Acceptance Criteria Matrix (Phase 1 MVP)

| Module | Verification Step | Expected Result |
| :--- | :--- | :--- |
| **Authentication** | Register user with email, password, and org details. | User created in DB, password hashed with bcrypt, JWT token returned, organization membership assigned. |
| **Data Isolation** | User A tries to view User B's private buyer requirement via ID. | Server responds with `403 Forbidden` or `404 Not Found`; zero data leak. |
| **Marketplace Search** | Query `/api/v1/listings?category=SOLAR_POWER&state=Gujarat&minCapacityMw=5`. | Returns only published solar listings located in Gujarat with >= 5 MW available capacity. |
| **Deterministic Matching** | Evaluate 10 MW Solar requirement in Rajasthan against 12 MW Solar Rajasthan listing. | Engine scores high compatibility (>85%) and outputs explicit matching criteria list. |
| **Procurement Calculator** | Run landed cost formula: Energy Rs 3.50 + Wheeling Rs 0.60 + CSS Rs 1.50 + AS Rs 0.40 + 4% STU loss on delivered energy. | Correct gross-up for losses applied: $(3.50 / (1 - 0.04)) + 0.60 + 1.50 + 0.40 = 6.1458$ Rs/kWh. Reproducible to 4 decimal places. |
| **Admin Moderation** | Admin reviews listing in `UNDER_REVIEW` and clicks `APPROVE`. | Listing status transitions to `PUBLISHED`, timestamped record added to `AuditLog`, listing immediately becomes visible in public search. |
| **Disclaimers & Labelling** | Check demo listings and footer. | All demo items visibly display `DEMO DATA — NOT A REAL OFFER`. Footer contains explicit CERC/SERC regulatory disclaimer. |
