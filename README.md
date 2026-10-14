# Electricity Bazaar (ElectricityBazaar.in)

> **India's Marketplace for Electricity & Energy Solutions**  
> *Discover Power. Compare Opportunities. Connect with Confidence.*

---

## 1. Overview & Vision

**Electricity Bazaar** is a dedicated B2B digital marketplace and procurement intelligence platform tailored specifically for India's power and renewable energy ecosystem. 

The platform connects commercial and industrial (C&I) electricity buyers, renewable energy project developers (Solar, Wind, Hybrid, RTC), captive & group captive generators, licensed electricity traders, battery energy storage system (BESS) providers, pumped storage hydro developers, solar EPC contractors, electrical equipment suppliers, and power-sector advisory consultants.

### Crucial Regulatory Notice
> **IMPORTANT REGULATORY DISCLAIMER**: Electricity Bazaar is an informational, discovery, matching, and enquiry platform. It is **not** an authorized power exchange (such as IEX, PXIL, or HPX), is **not** a licensed electricity trading entity under Section 14 of the Electricity Act 2003, and does **not** execute binding electricity scheduling, clearing, dispatch, or settlement. All transactions, open access petitions, PPAs, and connectivity filings remain subject to respective Central Electricity Regulatory Commission (CERC) and State Electricity Regulatory Commission (SERC) regulations, Open Access Regulations, and bilateral contractual agreements between authorized parties.

---

## 2. Core Value Proposition

1. **Structured Discovery**: Search & filter power purchase opportunities across states, generation technologies (Solar, Wind, Hybrid RTC, Hydro, Biomass), commercial structures (Third-Party Open Access, Group Captive, Captive, Rooftop PPA, EPC), and contract tenures (short-term, medium-term, long-term).
2. **Deterministic Matchmaking**: Algorithmic compatibility scoring based on consumer contract demand, load profile, target green energy percentage, geographic interconnection (CTU/STU), and developer commissioning timelines.
3. **Transparent Landed-Cost Calculator**: High-precision economic modeling factoring in state-specific grid tariffs, wheeling charges, cross-subsidy surcharge (CSS), additional surcharge (AS), banking charges, transmission losses (CTU + STU), and SLDC scheduling fees.
4. **Trust & Scope-Based Verification**: Verification badges for registered entities reflecting audited document verification (incorporation, net-worth certificates, connectivity approvals, land possession, PPA track record) with timestamped audit trails.

---

## 3. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts (for generation profiles and tariff sensitivity).
- **Backend**: Node.js (v20+ / v24+), TypeScript, Express/Fastify API framework, Prisma ORM, Zod validation.
- **Database**: PostgreSQL (relational integrity, JSONB support for technical specs, composite indices).
- **Testing**: Vitest for frontend & backend unit tests, Supertest for API integration tests.
- **Hosting Targets**: Netlify (Frontend SPA / Static assets) & Railway (API service, PostgreSQL database, Background worker).

---

## 4. Repository Structure

```text
/
├── .gitignore
├── README.md                 # Project vision, regulatory notice, and quickstart
├── ARCHITECTURE.md           # System architecture, security model, and deployment topology
├── DATABASE_DESIGN.md        # Relational schema, Prisma models, constraints & indexes
├── API_SPEC.md               # REST API endpoints, DTO contracts, and error structures
├── IMPLEMENTATION_PLAN.md    # Phased milestone roadmap with testable acceptance criteria
├── backend/                  # Node.js + TypeScript + Express/Fastify + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── tests/
│   ├── package.json
│   └── tsconfig.json
└── frontend/                 # React + TypeScript + Vite + Tailwind CSS SPA
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── context/
    │   ├── hooks/
    │   ├── pages/
    │   ├── services/
    │   └── types/
    ├── public/
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 5. Development Setup & Prerequisites

- **Node.js**: `v20.x` or `v24.x`
- **npm**: `v10.x` or `v11.x`
- **PostgreSQL**: `v15+`
- **Git**

Detailed setup steps and environment configuration can be found in [ARCHITECTURE.md](file:///d:/Electricity%20Bazaar/ARCHITECTURE.md) and [IMPLEMENTATION_PLAN.md](file:///d:/Electricity%20Bazaar/IMPLEMENTATION_PLAN.md).
