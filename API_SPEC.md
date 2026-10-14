# API_SPEC.md — REST API Contract & Specification (`/api/v1`)

## 1. Global API Conventions

- **Base URL Prefix**: `/api/v1`
- **Content Type**: `application/json; charset=utf-8`
- **Authentication**: Bearer Token in HTTP Authorization Header:
  `Authorization: Bearer <JWT_ACCESS_TOKEN>`
- **Response Format**:
  All API responses use a standard envelope format:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "totalCount": 142,
    "totalPages": 8
  }
}
```

- **Standard Error Format**:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Invalid capacity or negative tariff supplied",
    "details": [
      { "field": "availableCapacityMw", "issue": "Must be greater than 0" }
    ]
  }
}
```

---

## 2. API Endpoints by Domain

### 2.1 Health & Diagnostics
- `GET /api/v1/health`: Basic liveness probe.
- `GET /api/v1/ready`: Readiness probe verifying database connection pool health.

### 2.2 Authentication & User Lifecycle
- `POST /api/v1/auth/register`:
  - Request: `{ email, password, fullName, phone, organisationName, orgType, registeredState }`
  - Action: Creates user, creates organization, assigns `BUYER_ADMIN` or `SELLER_ADMIN`, returns tokens.
- `POST /api/v1/auth/login`:
  - Request: `{ email, password }`
  - Response: `{ user, activeOrganisation, accessToken, refreshToken }`
- `POST /api/v1/auth/refresh`:
  - Request: `{ refreshToken }`
  - Response: `{ accessToken, refreshToken }`
- `GET /api/v1/auth/me`:
  - Returns authenticated user profile, active organisation, and active roles.

### 2.3 Marketplace Listings
- `GET /api/v1/listings`:
  - Query Parameters:
    - `category`: Filter by `ListingCategory` enum
    - `state`: Filter by Indian State (e.g. `Gujarat`, `Rajasthan`, `Maharashtra`)
    - `minCapacityMw`, `maxCapacityMw`: Numeric range
    - `commercialModel`: Filter by `CommercialModel` enum
    - `interconnection`: `CTU_INTER_STATE` | `STU_INTRA_STATE`
    - `projectStatus`: `OPERATIONAL` | `READY_TO_BUILD` | etc.
    - `isVerifiedOnly`: Boolean
    - `sort`: `RECENT` | `CAPACITY_ASC` | `CAPACITY_DESC` | `PRICE_ASC`
    - `page`, `limit`: Pagination parameters (default: 20, max: 100)
  - Returns public, published listings with developer verification badges.
- `GET /api/v1/listings/:idOrSlug`:
  - Returns complete listing details, technical specifications (renewable / storage), and non-confidential public documents.
- `POST /api/v1/listings`:
  - Role: `SELLER_USER`, `SELLER_ADMIN`
  - Creates a new listing in `DRAFT` status scoped to the seller's organisation.
- `PATCH /api/v1/listings/:id`:
  - Updates draft or editable listing attributes.
- `POST /api/v1/listings/:id/submit-review`:
  - Transitions listing status from `DRAFT` to `UNDER_REVIEW`.

### 2.4 Buyer Requirements & Matching
- `POST /api/v1/requirements`:
  - Role: `BUYER_USER`, `BUYER_ADMIN`
  - Submits an electricity procurement requirement. Confidential fields (e.g. Discom, sanctioned load, current tariff) stored privately.
- `GET /api/v1/requirements`:
  - Lists requirements belonging to the buyer's active organisation.
- `GET /api/v1/requirements/:id/matches`:
  - Executes the deterministic matching engine against the requirement:
    - Evaluates: (1) Geographical compatibility (State/CTU), (2) Capacity availability (50%-150% demand window), (3) Technology preference, (4) Commercial structure, (5) Commissioning timeline.
    - Response contains match score (0-100%) and transparent, human-readable match rationale list (e.g., `["Matches Gujarat STU network", "Available capacity 4.5 MW fits 5 MW requirement", "Zero Cross-Subsidy under Group Captive"]`).

### 2.5 Enquiries & Negotiation Workflow
- `POST /api/v1/enquiries`:
  - Role: `BUYER_USER`, `BUYER_ADMIN`
  - Initiates an enquiry against a specific listing, optionally linking a buyer requirement.
  - Requires explicit consent checkbox to share buyer identity and load parameters with the seller.
- `GET /api/v1/enquiries`:
  - Lists enquiries sent (for buyers) or received (for sellers).
- `GET /api/v1/enquiries/:id`:
  - Detailed enquiry view including complete message history and audit timeline.
- `POST /api/v1/enquiries/:id/messages`:
  - Sends a response message in the enquiry thread.
- `PATCH /api/v1/enquiries/:id/status`:
  - Transitions status (`SHARED_WITH_SUPPLIER`, `RESPONSE_RECEIVED`, `NEGOTIATION`, `CLOSED`, `WITHDRAWN`).

### 2.6 Procurement Economics Calculator
- `POST /api/v1/calculator/evaluate`:
  - Input:
    ```json
    {
      "annualConsumptionKwh": 12000000,
      "currentLandedTariff": 8.50,
      "proposedEnergyTariff": 3.80,
      "transmissionChargePerKwh": 0.45,
      "wheelingChargePerKwh": 0.65,
      "crossSubsidySurchargePerKwh": 1.75,
      "additionalSurchargePerKwh": 0.50,
      "bankingChargesPerKwh": 0.20,
      "stuLossPercent": 3.8,
      "ctuLossPercent": 3.2,
      "sldcAndSchedulingChargePerKwh": 0.05,
      "contractedGreenSharePercent": 80.0
    }
    ```
  - Output:
    - Current annual cost (INR)
    - Proposed landed energy cost (INR/kWh)
    - Total proposed annual cost (INR)
    - Net annual savings (INR and %)
    - Break-even tariff (INR/kWh)
    - Sensitivity tables across +/- 10% tariff adjustments.
- `POST /api/v1/calculator/save`: Saves calculation run to authenticated user's workspace.
- `GET /api/v1/calculator/saved`: Retrieves saved calculation scenarios.

### 2.7 Tenders & Services
- `GET /api/v1/tenders`: Searchable public energy tenders with submission deadlines (Asia/Kolkata timezone formatting).
- `GET /api/v1/services`: Advisory, EPC, and energy audit service providers directory.

### 2.8 Administrator & Verification Console
- `GET /api/v1/admin/listings/review-queue`:
  - Role: `VERIFICATION_OFFICER`, `PLATFORM_ADMIN`
  - Retrieves listings pending publication.
- `POST /api/v1/admin/listings/:id/review`:
  - Action: `APPROVE`, `REJECT`, `REQUEST_CHANGES` with mandatory reviewer comments.
- `GET /api/v1/admin/verifications/queue`:
  - Organisations awaiting verification badge audit.
- `POST /api/v1/admin/verifications/:orgId/decision`:
  - Grants or revokes scope-specific verification badge with evidence log.
- `GET /api/v1/admin/audit-logs`:
  - System-wide immutable security and event audit log.
