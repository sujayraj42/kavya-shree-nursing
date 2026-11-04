# API Contract: Kavya Shree Institute of Nursing

> Shared contract between Backend (Express/Mongoose) and Frontend (Angular 22).
> All API endpoints are prefixed with `/api`.
> Success responses follow `{ success: true, ... }`, error responses follow `{ success: false, error: string }`.

---

## 1. Public Endpoints

### 1.1 Health & Diagnostics
- **`GET /api/health`**
  - **Auth:** None
  - **Headers:** `Cache-Control: no-cache`
  - **Response 200:**
    ```json
    {
      "status": "healthy",
      "database": "connected",
      "timestamp": "2026-11-04T15:30:00.000Z",
      "uptime": 12345
    }
    ```

### 1.2 Candidate Enquiries
- **`POST /api/enquiries`**
  - **Auth:** None (Rate-limited, express-rate-limit 10/15min)
  - **Honeypot:** `website` (must be empty string or omitted; if filled, silently returns 201)
  - **Request Body:**
    ```json
    {
      "name": "Ananya Kumari",
      "phone": "9876543210",
      "program": "General Nursing & Midwifery (GNM)",
      "email": "ananya@example.com",
      "message": "Interested in 2026 admissions",
      "consent": true,
      "source": "website_form",
      "website": ""
    }
    ```
  - **Validation:**
    - `name`: String, 2-100 chars, sanitized (no script/HTML)
    - `phone`: 10-digit Indian mobile format `^[6-9]\d{9}$` or standard 10-digit
    - `program`: One of advertised programs
    - `consent`: Must be `true`
    - `email`: Optional, valid email syntax
    - `message`: Optional, max 1000 chars
  - **Response 201:**
    ```json
    {
      "success": true,
      "message": "Enquiry registered successfully",
      "data": {
        "id": "6727a81014a4b4e123456789",
        "referenceId": "REF-KS-2026-6789",
        "createdAt": "2026-11-04T15:30:00.000Z"
      }
    }
    ```

### 1.3 Online Formal Applications
- **`POST /api/applications`**
  - **Auth:** None (Rate-limited, 5/hour per IP)
  - **Request Body:** `multipart/form-data` or JSON with hosted document URLs:
    ```json
    {
      "applicantName": "Pooja Sharma",
      "gender": "Female",
      "dob": "2005-04-12",
      "fatherName": "Rajesh Sharma",
      "motherName": "Sunita Sharma",
      "phone": "9876543210",
      "email": "pooja@example.com",
      "category": "General",
      "address": {
        "street": "Ward 4, Main Road",
        "district": "Patna",
        "state": "Bihar",
        "pincode": "800001"
      },
      "program": "Bachelor of Science in Nursing (B.Sc.)",
      "academicDetails": {
        "tenthBoard": "BSEB",
        "tenthYear": 2021,
        "tenthPercentage": 78.5,
        "twelfthBoard": "BSEB",
        "twelfthYear": 2023,
        "twelfthPercentage": 74.2,
        "pcbPercentage": 72.0
      },
      "declaration": true
    }
    ```
  - **File Uploads (multipart):**
    - `photo`: JPG/PNG, max 2MB
    - `tenthMarksheet`: PDF/JPG, max 2MB
    - `twelfthMarksheet`: PDF/JPG, max 2MB
  - **Response 201:**
    ```json
    {
      "success": true,
      "message": "Application submitted successfully",
      "data": {
        "id": "6727b92014a4b4e987654321",
        "applicationNumber": "KSIN-2026-APP-1042",
        "program": "Bachelor of Science in Nursing (B.Sc.)",
        "applicantName": "Pooja Sharma",
        "submittedAt": "2026-11-04T15:35:00.000Z"
      }
    }
    ```

### 1.4 Public Content Endpoints (Cached with Fallbacks)
- **`GET /api/content/notices`**
  - Returns active institutional announcements & notice bar item.
- **`GET /api/content/courses`**
  - Returns 5 advertised courses with syllabus, eligibility, career prospects.
- **`GET /api/content/approvals`**
  - Returns statutory affiliations & inspection certificates.
- **`GET /api/content/faculty`**
  - Returns nursing faculty list.
- **`GET /api/content/hospital-tieups`**
  - Returns clinical affiliation hospital details.
- **`GET /api/content/gallery`**
  - Returns gallery categories (campus, labs, hostel, clinical).
- **`GET /api/content/faqs`**
  - Returns admissions & curriculum FAQ items.
- **`GET /api/content/downloads`**
  - Returns prospectus & application forms (file names, URLs, size).

---

## 2. Admin Protected Endpoints (Bearer JWT or httpOnly Cookie)

### 2.1 Authentication
- **`POST /api/admin/login`**
  - Request: `{ "email": "...", "password": "..." }`
  - Response 200: `{ "success": true, "token": "...", "admin": { "id", "email", "name", "role" } }`
  - Also sets httpOnly cookie `ks_admin_token` (secure in production).
- **`GET /api/admin/me`**
  - Returns verified admin session details.
- **`POST /api/admin/logout`**
  - Clears auth cookie.
- **`PATCH /api/admin/me/password`**
  - Change password: `{ "currentPassword": "...", "newPassword": "..." }`

### 2.2 Enquiry Management
- **`GET /api/admin/enquiries`**
  - Query params: `page`, `limit`, `status`, `program`, `search`, `dateFrom`, `dateTo`
- **`GET /api/admin/enquiries/export`**
  - Streams CSV with headers `Content-Type: text/csv`
- **`GET /api/admin/enquiries/:id`**
- **`PATCH /api/admin/enquiries/:id/status`**
  - Request: `{ "status": "new"|"contacted"|"in_review"|"admitted"|"closed"|"archived" }`
- **`POST /api/admin/enquiries/:id/notes`**
  - Request: `{ "text": "..." }`
- **`DELETE /api/admin/enquiries/:id`**
  - Soft delete (sets `deletedAt`), restricted to superadmin.

### 2.3 Formal Application Management
- **`GET /api/admin/applications`**
  - Query params: `page`, `limit`, `status`, `program`, `search`
- **`GET /api/admin/applications/export`**
  - Streams applications CSV.
- **`GET /api/admin/applications/:id`**
  - Returns full application details + uploaded document URLs.
- **`PATCH /api/admin/applications/:id/status`**
  - Status: `"submitted" | "under_review" | "document_verified" | "provisionally_selected" | "rejected"`

### 2.4 Content Management (CRUD)
- **`POST/PUT/DELETE /api/admin/content/:section`**
  - Section: `courses`, `notices`, `gallery`, `faculty`, `hospital-tieups`, `faqs`, `downloads`

---

## 3. Error Standard
```json
{
  "success": false,
  "error": "Human readable error message",
  "code": "VALIDATION_ERROR"
}
```
HTTP status codes used:
- `200 OK`, `201 Created`
- `400 Bad Request` (input validation failed)
- `401 Unauthorized` (missing/invalid credentials)
- `403 Forbidden` (insufficient role privileges)
- `404 Not Found` (resource missing)
- `409 Conflict` (duplicate submission)
- `429 Too Many Requests` (rate limiter triggered)
- `500 Internal Server Error` (unexpected crash)
- `503 Service Unavailable` (database unreachable)
