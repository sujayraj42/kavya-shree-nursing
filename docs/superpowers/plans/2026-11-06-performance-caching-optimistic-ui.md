# Performance Optimization, Redis Caching, DB Indexing & Optimistic UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate 1+N queries, add optimized database compound and text indexes, integrate a fault-tolerant Redis cache layer with in-memory fallback, streamline lazy loading, and implement optimistic UI updates across public forms and admin tables.

**Architecture:** 
- Backend query optimization with `.lean()` and selective projections to avoid Mongoose document hydration bottlenecks.
- Compound and text indexing in Mongoose models to replace expensive collection scans (`COLLSCAN`).
- Dual-tier caching service (`ioredis` + in-memory fallback) with route middleware and mutation invalidation.
- Angular Signal-based optimistic state transitions with automated rollback on network failure.

**Tech Stack:** Node.js / Express, MongoDB / Mongoose, `ioredis` (with in-memory TTL map fallback), Angular 22 Signals & Standalone Components, Vitest & Node test runner.

---

## Global Constraints
- Zero downtime: Redis must degrade seamlessly to in-memory caching if `REDIS_URL` is omitted.
- Backward compatibility: Existing API response contracts (`{ success: true, data: ... }`) must not change.
- Strict rollback: Optimistic UI changes in Angular must restore previous state if the server returns non-2xx.

## Review Focus
1. Rapid consecutive submissions or status toggles must not cause state desynchronization.
2. In-memory fallback cache must automatically evict expired keys without memory leaks.
3. Database text indexes must handle partial phone numbers and email queries safely.
4. Selective projection (`.select()`) in list queries must not strip fields required by existing client tables.
5. Optimistic form submission must preserve user input in case a rollback is triggered.

---

### Task 1: Add Compound and Text Indexes to Mongoose Schemas

**Files:**
- Modify: `backend/src/models/Enquiry.js`
- Modify: `backend/src/models/Application.js`
- Modify: `backend/src/models/Content.js`
- Modify: `backend/src/models/Admin.js`
- Test: `backend/tests/security-hardening.test.js` or `backend/tests/database-indexes.test.js`

- [ ] Add compound indexes: `{ deletedAt: 1, status: 1, createdAt: -1 }`, `{ deletedAt: 1, program: 1, createdAt: -1 }` to `Enquiry.js`.
- [ ] Add compound text search index `{ name: 'text', phone: 'text', email: 'text' }` to `Enquiry.js`.
- [ ] Add compound indexes: `{ deletedAt: 1, status: 1, createdAt: -1 }`, `{ deletedAt: 1, program: 1, createdAt: -1 }` to `Application.js`.
- [ ] Add compound text search index `{ applicantName: 'text', phone: 'text', email: 'text', applicationNumber: 'text' }` to `Application.js`.
- [ ] Add unique index for `email` on `Admin.js`.
- [ ] Verify index definitions via automated test suite.

---

### Task 2: Eliminate 1+N Queries and Heavy Hydration in Controllers

**Files:**
- Modify: `backend/src/controllers/admin.controller.js`
- Modify: `backend/src/controllers/application.controller.js`
- Modify: `backend/src/middleware/authenticateAdmin.js`
- Test: `backend/tests/admin-enquiry.test.js`

- [ ] In `listEnquiries`: Apply `.select('name phone email program status createdAt')` and `.lean()` so heavy embedded `notes` are not loaded into memory on list views.
- [ ] In `listApplications`: Apply selective projection and `.lean()` for high-throughput pagination.
- [ ] In `authenticateAdmin.js`: Cache active admin session tokens in the cache service for 60 seconds to eliminate redundant database queries on every authenticated request.
- [ ] In `getDashboardStats`: Ensure single-roundtrip aggregation using MongoDB `$facet` for status totals and recent entries.

---

### Task 3: Build Resilient Redis & In-Memory Caching Service

**Files:**
- Create: `backend/src/services/cache.service.js`
- Create: `backend/src/middleware/cacheMiddleware.js`
- Modify: `backend/src/routes/content.routes.js`
- Modify: `backend/src/controllers/admin.controller.js`
- Modify: `backend/src/controllers/application.controller.js`
- Test: `backend/tests/cache.test.js`

- [ ] Install `ioredis` in `backend/package.json`.
- [ ] Implement `CacheService` with `get`, `set`, `del`, `delPattern` supporting both Redis and in-memory TTL fallback.
- [ ] Implement `cacheMiddleware` to cache public content routes (`/api/content/*`) and stats.
- [ ] Implement auto-invalidation hooks: clear `content:*` cache when content changes; clear `stats:*` when enquiry/application status updates.
- [ ] Write unit tests for cache hits, misses, TTL expiration, and graceful Redis failover.

---

### Task 4: Streamline Frontend Lazy Loading & Image Asset Performance

**Files:**
- Modify: `src/app/pages/home/home.component.html`
- Modify: `src/app/pages/gallery/gallery.component.html`
- Modify: `src/app/pages/faculty/faculty.component.html`
- Modify: `src/app/pages/about/about.component.html`
- Test: `src/app/pages/home/home.component.spec.ts`

- [ ] Audit all `<img>` tags: ensure non-hero images have `loading="lazy"` and `decoding="async"`.
- [ ] Ensure hero image has `loading="eager"` and `fetchpriority="high"`.
- [ ] Verify bundle splitting and lazy-loaded routes compile with optimal chunk size.

---

### Task 5: Implement Optimistic UI Updates in Public Forms and Admin Workflows

**Files:**
- Modify: `src/app/pages/home/home.component.ts`
- Modify: `src/app/shared/enquiry-modal/enquiry-modal.component.ts`
- Modify: `src/app/pages/admin/enquiries/admin-enquiry-list.component.ts`
- Modify: `src/app/pages/admin/applications/admin-application-list.component.ts`
- Test: `src/app/pages/home/home.component.spec.ts`
- Test: `src/app/shared/enquiry-modal/enquiry-modal.component.spec.ts`

- [ ] In `HomeComponent`: Immediately transition UI to confirmed submission state upon validation with a provisional ID (`KSN-ENQ-PENDING`), then update smoothly once the server responds. If the server fails, revert back to the form with preserved fields and show the error toast.
- [ ] In `EnquiryModalComponent`: Apply instant optimistic confirmation state before HTTP completion with rollback.
- [ ] In `AdminEnquiryListComponent`: When status dropdown is changed, immediately update the item's status badge in the UI signal list, reverting to previous status if the PATCH request fails.
- [ ] In `AdminApplicationListComponent`: Apply optimistic status updating for candidate applications.
- [ ] Write frontend unit tests asserting instant optimistic state transition and error rollback.

