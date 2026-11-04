# Execution Plan: Growth & Production Feature Upgrade

**Repository:** `sujayraj42/kavya-shree-nursing`  
**Live Site:** https://kavya-shree-nursing.vercel.app  
**Working Branch:** `feature/growth-upgrade`  
**Lead Engineer:** Antigravity Multi-Agent Architecture

---

## 1. Existing System Audit

### Routes & Components
- `/` (`HomeComponent`): Hero with campus visual, program preview, why choose us, consultation enquiry form, institutional location coordinates.
- `/about` (`AboutComponent`): Institutional philosophy, vision, mission, healthcare values.
- `/programs` (`ProgramsComponent`): Catalog of 5 nursing disciplines with category filtering.
- `/admissions` (`AdmissionsComponent`): Admissions criteria, procedure overview, consultation registration form.
- `/contact` (`ContactComponent`): Campus contact coordinates, phone numbers, map container, consultation form.
- `/admin` (`ADMIN_ROUTES`): Lazy-loaded admin portal with login, dashboard, enquiries table, detail view, status workflow.
- `**` (`NotFoundComponent`): 404 handler with return link.

### Design Tokens & System
- **Theme Color:** `#0f2942` (Deep Institutional Navy) / `#181818` (Eerie Black)
- **Accent:** `#eb9624` (Carrot Orange)
- **Academic Secondary:** `#124e9d` (Academic Blue)
- **Typography:** Lora (headings) & System/Arial Sans (body, UI)
- **Geometry:** 4px radius (`--round-4`), crisp borders (`#e5e5e5`), 48px touch targets.
- **Reference Doc:** Full tokens logged in `DESIGN_TOKENS.md`.

### Existing Backend Endpoints
- `GET /api/health`: System & database health.
- `POST /api/enquiries`: Public candidate admissions enquiry.
- `POST /api/admin/login`: Administrator JWT authentication.
- `GET /api/admin/me`: Session identity verification.
- `GET /api/admin/stats`: Aggregate dashboard metrics.
- `GET /api/admin/enquiries`: Paginated list with filters.
- `GET /api/admin/enquiries/:id`: Detailed candidate inquiry + internal notes.
- `PATCH /api/admin/enquiries/:id/status`: Pipeline state updates.
- `POST /api/admin/enquiries/:id/notes`: Internal audit notes.

### Backend Deployment Architecture
- **Primary Live Backend:** Deployed on Render at `https://kavya-shree-nursing.onrender.com/api` (managed via `backend/render.yaml` with keepalive cron).
- **Vercel Serverless Integration:** Serverless function wrapper `api/index.js` enabling full `/api/*` execution directly on Vercel with cached MongoDB connection.
- **Frontend Vercel:** Static/SSR build deployed from `dist/kavya-shree-nursing/browser`.

### Secrets Audit
- ✅ No `.env`, MongoDB connection strings, or JWT secrets are committed to git.
- ✅ `backend/.env.example` provides clean template keys.
- ✅ `backend/.env` is ignored by `.gitignore`.

---

## 2. Risk Management & Constraints

1. **Golden Rule Adherence:**
   - Zero modifications to existing typography, layout structure, color schemes, or component CSS.
   - All additions are additive and inherit existing tokens (`--color--carrot-orange`, `--color--eeire-black`, `--font--lora`, `--font--sans`).
2. **Institutional Integrity:**
   - No fabricated claims: no fake faculty names, pass rates, regulatory approvals (INC/KNC), seat counts, or fictitious student testimonials.
   - Any missing official data is marked `TODO: replace with real data` and gracefully hidden or populated from structured fallback JSON.
3. **Performance & Bundle Budget:**
   - Initial bundle kept below 500 kB budget.
   - Standalone Angular components with OnPush change detection and signals.
   - Lazy loading for all new feature routes and admin extensions.

---

## 3. Parallel Execution Workstreams

```
                                  +------------------------------------+
                                  | Lead Engineer: Step 0 Complete     |
                                  | - DESIGN_TOKENS.md & CONTRACT      |
                                  | - Branch feature/growth-upgrade    |
                                  +-----------------+------------------+
                                                    |
         +--------------------+---------------------+--------------------+--------------------+
         |                    |                     |                    |                    |
   [Workstream A]       [Workstream B]        [Workstream C]       [Workstream D]       [Workstream E/F]
   Backend API &        Floating Actions,     SSR, SEO, JSON-LD,   Content Pages:       Admin Panel &
   Applications         Notice Bar & Modal    Prerender & WebP     Courses, Approvals,  Hindi/English
   Express + Mongo      Angular UI            Core Web Vitals      Gallery, Faculty     Online Application
         |                    |                     |                    |                    |
         +--------------------+---------------------+--------------------+--------------------+
                                                    |
                                          +---------v----------+
                                          | [Workstream H]     |
                                          | QA, Security Audit |
                                          | Vitest, Build, E2E |
                                          +--------------------+
```

### Workstream Schedule:
- **Workstream 1 (Backend Core & Applications):**
  - Applications model & route `POST /api/applications`, `GET /api/admin/applications`
  - Enquiry enhancements: CSV export, date filter, soft delete
  - Content API: notices, courses, approvals, faculty, gallery, FAQs, downloads
  - Vercel serverless adapter `api/index.js`
- **Workstream 2 (Floating Actions, Notice Bar & Enquiry Modal):**
  - Floating WhatsApp & Call button (bottom right desktop, slim mobile bottom bar)
  - Dismissible notice bar above header
  - Reusable Enquiry form & modal component
- **Workstream 3 (Content Pages & Sections):**
  - Course detail pages (`/programs/:id`), Approvals viewer, Gallery with lightbox, Faculty & Hospital tie-ups, FAQ accordion, Notices & News, Prospectus downloads
- **Workstream 4 (Hindi/English & Multi-Step Online Application):**
  - Lightweight i18n service (English & Hindi)
  - 5-step online application form (`/apply`)
- **Workstream 5 (Admin Extensions):**
  - Applications viewer, CSV exports, content management tabs, password change
- **Workstream 6 (Images & Assets):**
  - Clean illustrative WebP images with single configurable JSON mapping
- **Workstream 7 (QA, SEO, SSR & Final Polish):**
  - JSON-LD, meta tags, sitemap, test suites, accessibility check

