# Real-World User Breakdown Prevention: 10 Critical Failure Modes, Tests & Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development to implement this plan task-by-task following Red-Green-Refactor.

**Goal:** Identify and fix the top 10 ways real users, network conditions, and input anomalies break down the Kavya Shree Nursing Institute web application, writing a dedicated test for each failure mode and implementing production-grade defensive fixes.

**Architecture:** Strengthen server-side validation layers, add submission deduplication, sanitize Excel formula injection, sanitize admin note inputs, validate PIN codes, enforce nursing council age limits (17-35), normalize Indian phone formats (`+91`/`0`), guard against NoSQL query object injection, handle duplicate application reference collisions gracefully, and protect public candidate receipt PII.

**Tech Stack:** Node.js, Express, Mongoose, Vitest, Node.js native test runner (`node:test`, `supertest`).

---

## 10 Breakdown Vectors Identified

1. **Vector 1: Rapid Double-Click / Race Condition on Online Application (`POST /api/applications`)**
   - *Breakdown:* Network jitter or impatient double-clicks generate duplicate application documents with two different reference IDs for the same student.
   - *Fix:* In-memory & DB deduplication window (60 seconds) on `phone + program` returning `409 Conflict`.

2. **Vector 2: Phone Numbers with Country Codes (`+91`, `91`, or leading `0`)**
   - *Breakdown:* Legitimate candidates copying numbers or using mobile autofill with `+91 9876543210` or `09876543210` get rejected with a 400 validation error.
   - *Fix:* Phone normalizer that strips non-digits, strips leading `+91`, `91`, or `0` when length is 11-12 digits, and verifies exactly 10 digits starting with 6-9.

3. **Vector 3: Unrealistic / Malformed Date of Birth (Nursing Age Limit 17–35)**
   - *Breakdown:* Candidates entering today's date, future dates, or toddlers bypass validation because any valid Date object was accepted.
   - *Fix:* Enforce BNRC / INC age requirements: applicant must be at least 17 years old and at most 35 years old as of December 31st of admission year.

4. **Vector 4: Academic Percentage Boundary Breakdown (Negative, > 100%, Infinity)**
   - *Breakdown:* Submitting `pcbPercentage: 99999` or `-25` or `Infinity` succeeds and corrupts merit sorting and database integrity.
   - *Fix:* Enforce strict range `0 <= percentage <= 100` with finite number check on `tenthPercentage`, `twelfthPercentage`, and `pcbPercentage`.

5. **Vector 5: Invalid Indian Postal Pincode**
   - *Breakdown:* Submitting `pincode: "abc"` or `"000000"` or `"123"` succeeds because only truthiness was checked.
   - *Fix:* Enforce Indian PIN code standard regex: `/^[1-9][0-9]{5}$/` (6 digits, cannot start with 0).

6. **Vector 6: CSV / Excel Formula Injection (CWE-1236) in Admin Exports**
   - *Breakdown:* Candidate name or message starting with `=`, `+`, `-`, `@` triggers formula execution / DDE when opened in Microsoft Excel.
   - *Fix:* Prefix cells starting with `=, +, -, @, \t, \r` with a single quote `'` in `escapeCsvCell`.

7. **Vector 7: NoSQL / Type Confusion Injection in Query Parameters (`?search[$regex]=`)**
   - *Breakdown:* Sending query params as objects (e.g. `?search[foo]=bar`) causes `TypeError: text.replace is not a function` or unexpected Mongoose query behavior.
   - *Fix:* Validate and coerce `search`, `status`, `program`, `page`, `limit` to primitives; reject or ignore object injections.

8. **Vector 8: Stored XSS / Unsanitized HTML in Admin Notes**
   - *Breakdown:* Notes added via `POST /api/admin/enquiries/:id/notes` or `POST /api/applications/admin/:id/notes` store raw HTML/script tags.
   - *Fix:* Sanitize note text using `stripHtml` / `sanitize` before persisting to database.

9. **Vector 9: Unhandled MongoDB Duplicate Key Error (500) on Client-Supplied Application Number**
   - *Breakdown:* If a client submits a validly formatted `applicationNumber` that already exists in DB, Mongoose throws `E11000 duplicate key`, resulting in an unhandled 500 error.
   - *Fix:* Catch `11000` duplicate key errors and return clean `409 Conflict` or regenerate a unique reference number.

10. **Vector 10: PII Data Protection on Public Receipt Endpoint**
    - *Breakdown:* Unauthenticated public access to `/api/applications/:appNumber/receipt` exposes full phone number, parents' names, and home address.
    - *Fix:* Mask sensitive PII (mask phone as `XXXXXX1234`, mask email as `j***@example.com`, mask street address) unless accessed by authenticated staff or with secondary verification (e.g., DOB query param).

---

## Tasks

- [ ] **Task 1: Test Suite for the 10 Breakdown Vectors**
  - Create `backend/tests/real-user-breakdowns.test.js` covering all 10 scenarios with assertions.
  - Run the test suite and verify which tests fail.

- [ ] **Task 2: Implement Fixes in Backend Controllers & Services**
  - Update `backend/src/controllers/application.controller.js` (deduplication, phone normalization, DOB age limits, percentage bounds, pincode validation, duplicate key handling, PII masking).
  - Update `backend/src/middleware/validateEnquiry.js` (phone normalization with `+91`/`0` stripping).
  - Update `backend/src/controllers/admin.controller.js` (CSV formula sanitization, note HTML stripping, safe string handling for query search).
  - Update `backend/src/services/receipt.service.js` (masked PII on public receipts).

- [ ] **Task 3: Run Full Test Verification & Build Check**
  - Run `node --test backend/tests/real-user-breakdowns.test.js` to ensure 10/10 tests pass.
  - Run all backend test suites (`node --test backend/tests/*.test.js`).
  - Run frontend test suite (`npm test`).
  - Run production build (`npm run build`).

