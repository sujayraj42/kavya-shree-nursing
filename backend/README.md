# Kavya Shree Institute of Nursing — Backend Service

A production-oriented, standalone Node.js and Express REST API service for Kavya Shree Institute of Nursing candidate enquiry intake, administrative portal management, and health monitoring.

## Tech Stack
- **Runtime:** Node.js LTS (v18+)
- **Framework:** Express.js 4.21+
- **Database:** MongoDB Atlas via Mongoose 8.9+
- **Authentication & Security:** JWT (`jsonwebtoken`), Password Hashing (`bcryptjs`), Helmet 8, CORS, Express-Rate-Limit 7, Dotenv
- **Testing:** Native Node.js Test Runner (`node:test`, `node:assert/strict`) & Supertest
- **Deployment Platform:** Render (Web Service) / Docker compatible

---

## Directory Structure
```
backend/
├── .env.example              # Environment variables template with safe placeholders
├── .gitignore                # Excludes .env, node_modules, and logs
├── render.yaml               # Render Infrastructure-as-Code Blueprint
├── package.json              # Backend scripts and dependencies
├── src/
│   ├── app.js                # Express app setup (Helmet, CORS, body-parser, trust proxy, routes)
│   ├── server.js             # Server lifecycle (listens on 0.0.0.0, DB connection, graceful shutdown)
│   ├── config/
│   │   ├── env.js            # Environment variable validation and fail-fast production checks
│   │   └── database.js       # MongoDB connection management, connection states, and retry policies
│   ├── controllers/
│   │   └── admin.controller.js # Admin authentication, enquiry listing, status update, notes
│   ├── middleware/
│   │   ├── authenticateAdmin.js # JWT Bearer validation and admin identity binding
│   │   ├── errorHandler.js   # Centralized error handling (400, 401, 404, 413, 500 without leaks)
│   │   ├── rateLimiter.js    # Global (100/15m), enquiry (10/15m), and login (5/15m) limiters
│   │   └── validateEnquiry.js# Server-side input validation, length limits, and normalization
│   ├── models/
│   │   ├── Admin.js          # Admin account schema with bcrypt hashing & safe serialization
│   │   └── Enquiry.js        # Enquiry schema with 6-status workflow & internal notes subdocument
│   ├── routes/
│   │   ├── admin.routes.js   # Administrative authentication and management routes
│   │   ├── enquiry.routes.js # Public candidate enquiry submission endpoint
│   │   └── health.routes.js  # GET /api/health endpoint (200 when healthy, 503 when DB down)
│   └── scripts/
│       └── seedAdmin.js      # Idempotent administrator provisioning command
└── tests/
    ├── admin.test.js         # Comprehensive authentication, auth guards, query & status tests (25 tests)
    ├── databaseError.test.js # Resiliency tests for connection drop and 503/500 scenarios (3 tests)
    ├── enquiry.test.js       # Public validation and submission test cases (9 tests)
    └── health.test.js        # Health check and JSON error test cases (4 tests)
```

---

## Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory for local development:
```bash
cp .env.example .env
```

| Variable | Default | Required in Production | Description |
|---|---|---|---|
| `PORT` | `5000` | Yes (provided by Render) | Port on which the HTTP server listens |
| `HOST` | `0.0.0.0` | Yes | Host interface to bind (must be `0.0.0.0` on Render) |
| `NODE_ENV` | `development` | Yes | Environment mode (`development` or `production`) |
| `MONGODB_URI` | `mongodb://localhost:27017/kavya_shree_nursing` | Yes | MongoDB Atlas connection string |
| `FRONTEND_ORIGIN`| `http://localhost:4200` | Yes | Allowed origin for CORS in production (e.g. Vercel URL) |
| `JWT_SECRET` | *(auto-fallback in dev only)* | **Yes** | Cryptographic secret for signing admin JWT session tokens |
| `JWT_EXPIRES_IN` | `8h` | No | Expiration duration for administrative session tokens |
| `RATE_LIMIT_WINDOW_MS` | `900000` (15m) | No | Rate limiting evaluation window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | No | Max requests per IP in the window for general endpoints |
| `ENQUIRY_RATE_LIMIT_MAX` | `10` | No | Max enquiry submissions per IP in the window |
| `ADMIN_LOGIN_RATE_LIMIT_MAX` | `5` | No | Max admin login attempts per IP per 15 minutes |
| `ADMIN_SEED_EMAIL` | — | For `npm run seed:admin` | Email for initial administrator provisioning |
| `ADMIN_SEED_PASSWORD` | — | For `npm run seed:admin` | Password for initial administrator (min 8 chars) |
| `ADMIN_SEED_NAME` | `Institute Administrator` | No | Display name for initial administrator |

> **Production Safety Note:** If `NODE_ENV=production`, the application requires `MONGODB_URI`, `FRONTEND_ORIGIN`, and `JWT_SECRET` to be explicitly defined. If any are missing or invalid, the process terminates immediately on startup with a fatal log.

---

## Administrator Provisioning

Initial administrative accounts are provisioned idempotently using the seed script:
```bash
ADMIN_SEED_EMAIL="admin@kavyashreenursing.edu.in" ADMIN_SEED_PASSWORD="<strong-password>" npm run seed:admin
```
- **Idempotent:** If an administrator with the specified email already exists, no changes or overwrites are made.
- **Zero Exposure:** Passwords, hashes, and secrets are never printed in console output or log files.
- Passwords are encrypted using `bcryptjs` with 12 salt rounds before database persistence.

---

## API Endpoints

### 1. Health Check
- **Route:** `GET /api/health`
- **Rate Limit:** Global (100 requests / 15 minutes)
- **Response `200 OK` (Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-28T14:30:00.000Z",
  "uptime": 120,
  "database": "connected"
}
```

---

### 2. Public Candidate Enquiry Submission
- **Route:** `POST /api/enquiries`
- **Rate Limit:** Strict (10 submissions / 15 minutes per IP)
- **Content-Type:** `application/json`
- **Request Body Fields:**
  - `name` *(string, required)*: Candidate full name (2–100 characters).
  - `phone` *(string/number, required)*: Phone number (10–15 digits; non-digits stripped automatically).
  - `email` *(string, optional)*: Valid email format (max 255 characters).
  - `program` *(string, required)*: One of the 5 provisional nursing programs.
  - `message` *(string, optional)*: Inquiries/notes (max 1,000 characters).
  - `consent` *(boolean, required)*: Must be `true`.
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Enquiry registered successfully",
  "data": {
    "id": "671e6245d8b7a12345678901",
    "program": "Bachelor of Science in Nursing (B.Sc.)",
    "status": "new",
    "createdAt": "2026-10-28T14:30:00.000Z"
  }
}
```

---

### 3. Administrative Authentication: Login
- **Route:** `POST /api/admin/login`
- **Rate Limit:** Strict (5 login attempts / 15 minutes per IP)
- **Request Body:**
```json
{
  "email": "admin@kavyashreenursing.edu.in",
  "password": "<admin-password>"
}
```
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Authentication successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "671e6245d8b7a12345678902",
    "email": "admin@kavyashreenursing.edu.in",
    "name": "Institute Administrator",
    "role": "superadmin",
    "lastLoginAt": "2026-10-28T14:30:00.000Z"
  }
}
```
- **Response `401 Unauthorized` (Generic):**
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```
*Note: Returns generic failures to prevent account enumeration.*

---

### 4. Administrative Profile: Current Identity
- **Route:** `GET /api/admin/me`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "admin": {
    "id": "671e6245d8b7a12345678902",
    "email": "admin@kavyashreenursing.edu.in",
    "name": "Institute Administrator",
    "role": "superadmin"
  }
}
```

---

### 5. Administrative Dashboard: Real-Time Aggregate Metrics
- **Route:** `GET /api/admin/stats`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 42,
      "new": 15,
      "contacted": 12,
      "in_review": 8,
      "admitted": 4,
      "closed": 3,
      "archived": 0
    },
    "recentEnquiries": [
      {
        "id": "671e6245d8b7a12345678901",
        "name": "Ananya Sharma",
        "status": "new",
        "createdAt": "2026-10-28T14:30:00.000Z"
      }
    ]
  }
}
```

---

### 6. Administrative Enquiries: Paginated Listing & Search
- **Route:** `GET /api/admin/enquiries`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` *(number, optional, default: 1)*
  - `limit` *(number, optional, default: 10, max: 100)*
  - `status` *(string, optional)*: Filter by status (`new`, `contacted`, `in_review`, `admitted`, `closed`, `archived`)
  - `program` *(string, optional)*: Filter by exact program name
  - `search` *(string, optional)*: Regex-escaped search across `name`, `phone`, and `email`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "enquiries": [
      {
        "id": "671e6245d8b7a12345678901",
        "name": "Ananya Sharma",
        "phone": "9661666485",
        "email": "ananya@example.com",
        "program": "Bachelor of Science in Nursing (B.Sc.)",
        "status": "new",
        "notes": [],
        "createdAt": "2026-10-28T14:30:00.000Z",
        "updatedAt": "2026-10-28T14:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 42,
      "page": 1,
      "limit": 10,
      "pages": 5
    }
  }
}
```

---

### 7. Administrative Enquiries: Detail by ID
- **Route:** `GET /api/admin/enquiries/:id`
- **Headers:** `Authorization: Bearer <token>`
- **Response `200 OK`:**
```json
{
  "success": true,
  "data": {
    "id": "671e6245d8b7a12345678901",
    "name": "Ananya Sharma",
    "phone": "9661666485",
    "email": "ananya@example.com",
    "program": "Bachelor of Science in Nursing (B.Sc.)",
    "message": "Interested in hostel accommodations.",
    "consent": true,
    "status": "contacted",
    "notes": [
      {
        "id": "671e6245d8b7a12345678905",
        "author": "Institute Administrator",
        "text": "Called candidate; confirmed seat availability.",
        "createdAt": "2026-10-28T14:35:00.000Z"
      }
    ],
    "createdAt": "2026-10-28T14:30:00.000Z",
    "updatedAt": "2026-10-28T14:35:00.000Z"
  }
}
```

---

### 8. Administrative Enquiries: Status Update
- **Route:** `PATCH /api/admin/enquiries/:id/status`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "status": "in_review"
}
```
*Valid Status Values:* `'new'`, `'contacted'`, `'in_review'`, `'admitted'`, `'closed'`, `'archived'`
- **Response `200 OK`:**
```json
{
  "success": true,
  "message": "Enquiry status updated successfully",
  "data": {
    "id": "671e6245d8b7a12345678901",
    "status": "in_review",
    "updatedAt": "2026-10-28T14:40:00.000Z"
  }
}
```

---

### 9. Administrative Enquiries: Add Internal Note
- **Route:** `POST /api/admin/enquiries/:id/notes`
- **Headers:** `Authorization: Bearer <token>`
- **Request Body:**
```json
{
  "text": "Sent admission brochure via WhatsApp and confirmed counselling date."
}
```
- **Security Guarantee:** The note author is strictly derived on the server from the authenticated administrator token identity (`req.admin.name` / `req.admin.email`). Client-supplied author fields are discarded to prevent identity spoofing.
- **Response `201 Created`:**
```json
{
  "success": true,
  "message": "Internal note added successfully",
  "data": {
    "id": "671e6245d8b7a12345678906",
    "author": "Institute Administrator",
    "text": "Sent admission brochure via WhatsApp and confirmed counselling date.",
    "createdAt": "2026-10-28T14:42:00.000Z"
  }
}
```

---

## Status Enum & Migration Compatibility

The agreed standard enquiry workflow status enum consists of 6 values:
`['new', 'contacted', 'in_review', 'admitted', 'closed', 'archived']`

### Backward Compatibility Policy:
- **Historical Records Preserved:** Any legacy records created with `status: 'resolved'` remain valid in the schema under `ALL_ALLOWED_STATUSES`.
- **Non-Destructive Mapping:** The helper `normalizeStatus(status)` maps `'resolved'` &rarr; `'closed'` for reporting without overwriting database history.
- **Workflow Integrity:** New updates via `PATCH /api/admin/enquiries/:id/status` strictly require one of the 6 active standard statuses.

---

## Running Locally

### Install Dependencies
```bash
cd backend
npm install
```

### Run Tests
```bash
npm test
```
*Current test suite: **44 passing tests** across 6 suites covering authentication, aggregation metrics, query filtering, pagination, status workflows, notes, error handling, rate limiting, and public submissions.*

### Start in Development Mode
```bash
npm run dev
```

### Start in Production Mode
```bash
npm start
```
