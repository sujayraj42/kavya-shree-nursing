# Complete UI Revamp (Magic UI Generator + 21st MCP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Revamp and tokenize the entire Kavya Shree Institute of Nursing frontend UI (`src/app/layout`, `src/app/shared`, `src/app/pages/*`, and `src/styles.css`) using the `magic-ui-generator` 3-variation workflow and `21st` CLI verification so every route ships high-contrast institutional UI with `0` `21st review` errors, warnings, or component-level hardcoded color drift.

**Architecture:** Each UI subsystem (Global Design Tokens & Shell Layout, Home & Academic Programs Showcase, Interactive Admissions & Multi-Step Application Wizard, and Institutional Trust Pages) is explored across 3 distinct `magic-ui-generator` / `21st` variations, locked to the approved iUniversity Institutional Identity (`#181818` Eerie Black, `#eb9624` Carrot Orange, `#124e9d` Academic Blue, `Lora` + `Arial/System Sans`), and verified via `21st review <path> --json` and Angular Vitest unit specs.

**Tech Stack:** Angular 22 (Standalone Components + Signals), TypeScript 5.9, Bootstrap 5 Grid, CSS Custom Properties (`src/styles.css`), `@21st-dev/cli` (`21st search`, `21st review`), Vitest (`ng test`).

**Spec:** `DESIGN_TOKENS.md`, `.21st/DESIGN.md`, `.21st/design.json`, and `ARCHITECTURE_GRAPH.md`

## Global Constraints

- Palette tokens in `src/styles.css` (`:root`) are authoritative: `--color--eeire-black: #181818`, `--color--carrot-orange: #eb9624`, `--color--blue: #124e9d`, `--color--gray: #4f4f4f`, `--color--gray-light: #6e7074`, `--color--white: #ffffff`, `--ks-bg-paper: #fafafa`, `--ks-bg-stone: #f4f4f4`, `--ks-rule: #e5e5e5`, `--ks-rule-strong: #d0d0d0`.
- Typography strictly uses `--font--lora` (`"Lora", Georgia, "Times New Roman", serif`) for headings and `--font--sans` (`Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`) for body/UI. Never introduce `Inter`, `Space Grotesk`, or `Instrument Serif`.
- Strictly forbidden anti-patterns: purple-to-blue gradients, gradient hero text, glassmorphism, emojis in headings, coloured left-border cards, generic buzzwords, cursor-following lines, buttons that fade on hover, or low-contrast dark mode.
- Minimum interactive touch target on mobile viewports (`360px`–`768px`) is `48px x 48px`.
- Every `target="_blank"` link must include `rel="noopener noreferrer"`, every `<img>` must include a static `alt` attribute alongside any dynamic `[alt]` binding, and every modal/drawer must support `Escape` key dismissal and `aria-modal="true"`.
- Every task must finish with `21st review <component-dir> --json` reporting `errors: 0, warnings: 0, suggestions: 0` on all modified component CSS/HTML files.

## Magic UI Generator 3-Variation Matrix (Global Direction Selection)

| Subsystem | Variation 1: Institutional Editorial Dossier *(Selected)* | Variation 2: Asymmetric Bento Grid | Variation 3: Minimalist Swiss Tabular |
| :--- | :--- | :--- | :--- |
| **1. Shell Layout (`header`, `notice-bar`, `footer`, `floating-actions`, `enquiry-modal`)** | Dark Eerie Black (`--color--eeire-black`) sticky masthead with live pulse notice ticker, 48px touch-target mobile drawer, and keyboard-accessible FAB tooltips. | Floating pill navbar with blurred backdrop (rejected: violates no-glassmorphism constraint). | Ultra-thin single-row white header without top helpline bar (rejected: hides critical admissions helpline numbers). |
| **2. Home & Academic Programs (`home`, `programs`, `course-detail`)** | High-contrast split hero with institutional trust strip, interactive program comparison matrix (`ANM`, `GNM`, `B.Sc.`), and structured clinical rotation dossier tabs. | Full-bleed masonry bento cards with hover-zoom overlays. | Text-only academic catalog table without visual campus framing. |
| **3. Admissions & Online Application (`admissions`, `apply`, `contact`)** | Guided 4-step stepper wizard (`Personal -> Academic -> Program & Category -> Undertaking`) with live fee/eligibility summary rail, instant field validation, and printable receipt card. | Single long-scroll form without step progress indicator. | Conversational 1-question-per-screen wizard (rejected: too slow for 18 academic fields). |
| **4. Institutional Trust & Campus Life (`approvals`, `faculty`, `gallery`, `notices`, `downloads`, `faqs`)** | Verified credential cards with official seal badges, filterable campus lightbox gallery, keyboard-accessible FAQ accordion, and direct PDF syllabus/prospectus download rows. | Carousel-heavy media sliders (rejected: poor mobile scanability). | Plain bulleted lists without credential metadata badges. |

## Review Focus

1. **Mobile 360px Viewport Overflow**: Long registration numbers (`KSIN-2026-APP-999999`), email addresses, or wide fee tables on `360px` screens must wrap or scroll inside `.table-responsive` without horizontal page overflow (`document.documentElement.scrollWidth <= window.innerWidth`).
2. **Keyboard-Only Modal & Accordion Navigation**: Pressing `Escape` while `EnquiryModalComponent` or mobile navigation drawer is open must close the overlay and restore usability; FAQ accordions and gallery filters must operate via `Enter`/`Space` with visible `--ks-focus-ring`.
3. **Bilingual (English / Hindi) Label Expansion**: Toggling `I18nService.toggleLanguage()` (`en` <-> `hi`) in `HeaderComponent` and `EnquiryModalComponent` must not clip button text or break navbar height.
4. **Offline / Degraded Network Submission on Apply & Enquiry Forms**: When `/api/applications` or `/api/enquiries` is unreachable, optimistic/offline queue state must still render a valid reference number and allow printing the provisional slip without throwing unhandled promise rejections.
5. **Zero Hardcoded Color Drift in Component CSS**: Running `21st review src/app --json` must report `0` `design-hardcoded-color` findings across all component stylesheets under `src/app/`.

---

### Task 1: Global Design Tokens & Shell Layout Revamp (`styles.css`, `header`, `notice-bar`, `footer`, `floating-actions`, `enquiry-modal`)

**Files:**
- Modify: `src/styles.css`
- Modify: `src/app/layout/header/header.component.css`
- Modify: `src/app/layout/notice-bar/notice-bar.component.css`
- Modify: `src/app/layout/footer/footer.component.css`
- Modify: `src/app/layout/floating-actions/floating-actions.component.css`
- Modify: `src/app/shared/enquiry-modal/enquiry-modal.component.css`
- Test: `src/app/layout/header/header.component.spec.ts`

**Interfaces:**
- Consumes: `I18nService`, `ModalService`
- Produces: Extended `:root` CSS custom properties in `src/styles.css` (`--ks-header-drawer-bg`, `--ks-header-cta-ink`, `--ks-whatsapp-brand`, `--ks-whatsapp-hover`, `--ks-whatsapp-dark`, `--ks-notice-bg`, `--ks-surface-subtle`, etc.) consumed by all component stylesheets in Tasks 1–4.

- [x] **Step 1: Write the failing test in `src/app/layout/header/header.component.spec.ts`**

```typescript
it('should close mobile navigation drawer when Escape key is pressed', () => {
  const fixture = TestBed.createComponent(HeaderComponent);
  const comp = fixture.componentInstance as any;
  comp.toggleMenu();
  expect(comp.isMenuOpen()).toBe(true);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  expect(comp.isMenuOpen()).toBe(false);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `npx ng test --watch=false --include=src/app/layout/header/header.component.spec.ts`
Expected: FAIL (`comp.isMenuOpen()` remains `true` on `Escape` keydown if not bound, or verify deterministic review fails with `21st review src/app/layout src/app/shared --json` showing `> 0` findings).

- [x] **Step 3: Add `@HostListener('document:keydown.escape')` in `src/app/layout/header/header.component.ts` and replace all hardcoded colors in `src/app/layout/*/*.css` and `src/app/shared/enquiry-modal/enquiry-modal.component.css` with `:root` tokens from `src/styles.css`**

Define semantic tokens in `src/styles.css` (`:root`) for WhatsApp brand green (`--ks-whatsapp-green: #25d366`, `--ks-whatsapp-hover: #20ba59`, `--ks-whatsapp-teal: #128c7e`), dark drawer surfaces (`--ks-drawer-bg: #14171a`), and subtle white alpha borders, then reference them via `var(--...)` with zero raw hex/rgba literals in `header.component.css`, `notice-bar.component.css`, `footer.component.css`, `floating-actions.component.css`, and `enquiry-modal.component.css`.

- [x] **Step 4: Run tests and `21st review` to verify resolution**

Run: `npx ng test --watch=false --include=src/app/layout/header/header.component.spec.ts` and `21st review src/app/layout src/app/shared --json`
Expected: All tests PASS and `21st review` reports `"summary": { "errors": 0, "warnings": 0, "suggestions": 0 }`.

- [x] **Step 5: Commit**

```bash
git add src/styles.css src/app/layout src/app/shared
git commit -m "feat(ui): revamp and tokenize shell layout and enquiry modal via 21st design tokens"
```

---

### Task 2: Home & Academic Programs Showcase Revamp (`home`, `programs`, `course-detail`)

**Files:**
- Modify: `src/app/pages/home/home.component.html`
- Modify: `src/app/pages/home/home.component.css`
- Modify: `src/app/pages/programs/programs.component.html`
- Modify: `src/app/pages/programs/course-detail/course-detail.component.html`
- Modify: `src/app/pages/programs/course-detail/course-detail.component.css`
- Test: `src/app/pages/home/home.component.spec.ts`

**Interfaces:**
- Consumes: `:root` CSS tokens from Task 1 (`src/styles.css`), `ContentService`, `ModalService`, `EnquiryService`.
- Produces: Tokenized `home.component.css` and `course-detail.component.css` with zero hardcoded colors and accessible static+dynamic `alt` attributes on all hero and program cards.

- [x] **Step 1: Run `21st review` on `home` and `programs` to capture baseline findings**

Run: `21st review src/app/pages/home src/app/pages/programs --json`
Expected: Reports `31` `design-hardcoded-color` findings across `home.component.css` (`15`) and `course-detail.component.css` (`16`).

- [x] **Step 2: Tokenize `home.component.css` and `course-detail.component.css` and audit `home.component.html`, `programs.component.html`, and `course-detail.component.html` for semantic headings, static `alt` attributes, and 48px CTA tap targets**

Replace all raw hex/rgb literals in `home.component.css` and `course-detail.component.css` with `:root` custom properties from `src/styles.css`. Ensure all `<img [src]="...">` tags also carry a static `alt` fallback and `aria-hidden="true"` on decorative SVGs.

- [x] **Step 3: Verify with `21st review` and unit tests**

Run: `21st review src/app/pages/home src/app/pages/programs --json` and `npx ng test --watch=false --include=src/app/pages/home/home.component.spec.ts`
Expected: `21st review` reports `"summary": { "errors": 0, "warnings": 0, "suggestions": 0 }` and `home.component.spec.ts` passes.

- [x] **Step 4: Commit**

```bash
git add src/styles.css src/app/pages/home src/app/pages/programs
git commit -m "feat(ui): tokenize and refine home and academic program views"
```

---

### Task 3: Admissions & Online Application Wizard Revamp (`admissions`, `apply`, `contact`)

**Files:**
- Modify: `src/app/pages/admissions/admissions.component.html`
- Modify: `src/app/pages/apply/apply.component.html`
- Modify: `src/app/pages/apply/apply.component.css`
- Modify: `src/app/pages/contact/contact.component.html`
- Test: `src/app/pages/apply/apply.component.spec.ts`

**Interfaces:**
- Consumes: `:root` CSS tokens from Task 1 (`src/styles.css`), `EnquiryService`.
- Produces: Tokenized `apply.component.css` (`0` hardcoded color findings) and accessible stepper controls with `aria-current="step"` on the active wizard step in `apply.component.html`.

- [x] **Step 1: Write or update unit test in `src/app/pages/apply/apply.component.spec.ts` verifying `aria-current="step"` on active wizard step and `21st review` zero-finding check**

```typescript
it('should mark the active wizard step with aria-current="step"', () => {
  const fixture = TestBed.createComponent(ApplyComponent);
  fixture.detectChanges();
  const activeStep = fixture.nativeElement.querySelector('[aria-current="step"]');
  expect(activeStep).toBeTruthy();
});
```

- [x] **Step 2: Run test and `21st review` to verify failure**

Run: `21st review src/app/pages/apply src/app/pages/admissions src/app/pages/contact --json`
Expected: Reports `23` `design-hardcoded-color` findings in `apply.component.css`.

- [x] **Step 3: Add `aria-current="step"` to the active wizard step indicator in `src/app/pages/apply/apply.component.html` and replace all 23 hardcoded colors in `src/app/pages/apply/apply.component.css` with `:root` tokens**

Map stepper states (completed, active, pending), upload dropzones, and receipt preview styles in `apply.component.css` to `:root` custom properties in `src/styles.css`.

- [x] **Step 4: Run `21st review` and unit tests to verify**

Run: `21st review src/app/pages/apply src/app/pages/admissions src/app/pages/contact --json` and `npx ng test --watch=false --include=src/app/pages/apply/apply.component.spec.ts`
Expected: `"summary": { "errors": 0, "warnings": 0, "suggestions": 0 }` and unit tests PASS.

- [x] **Step 5: Commit**

```bash
git add src/styles.css src/app/pages/apply src/app/pages/admissions src/app/pages/contact
git commit -m "feat(ui): revamp online application wizard accessibility and tokenize styles"
```

---

### Task 4: Institutional Trust & Campus Pages Revamp (`approvals`, `faculty`, `gallery`, `notices`, `downloads`, `faqs`)

**Files:**
- Modify: `src/app/pages/approvals/approvals.component.css`
- Modify: `src/app/pages/faculty/faculty.component.css`
- Modify: `src/app/pages/gallery/gallery.component.css`
- Modify: `src/app/pages/gallery/gallery.component.html`
- Modify: `src/app/pages/notices/notices.component.css`
- Modify: `src/app/pages/downloads/downloads.component.css`
- Modify: `src/app/pages/faqs/faqs.component.css`
- Modify: `.21st/design.json`

**Interfaces:**
- Consumes: `:root` CSS tokens from Task 1 (`src/styles.css`), `ContentService`.
- Produces: Zero component-level findings across the entire `src/app/` tree when running `21st review src/app --json` (`errors: 0, warnings: 0, suggestions: 0`).

- [x] **Step 1: Run `21st review` across the 6 institutional trust pages to confirm the 60 baseline hardcoded-color findings**

Run: `21st review src/app/pages/approvals src/app/pages/faculty src/app/pages/gallery src/app/pages/notices src/app/pages/downloads src/app/pages/faqs --json`
Expected: Reports `60` `design-hardcoded-color` findings across the 6 CSS files (`approvals`: 7, `faculty`: 10, `gallery`: 20, `notices`: 8, `downloads`: 5, `faqs`: 10).

- [x] **Step 2: Tokenize all 6 component CSS files (`approvals`, `faculty`, `gallery`, `notices`, `downloads`, `faqs`) and verify static `alt` attributes in `gallery.component.html`**

Replace all raw hex/rgba literals in the 6 CSS files with `:root` custom properties from `src/styles.css` and ensure `<img [src]="..." [alt]="..." alt="Campus facility photograph">` in `gallery.component.html` includes a static `alt` fallback. Record the completed whole-app UI revamp decision in `.21st/design.json`.

- [x] **Step 3: Run full `21st review src/app --json` and production Angular build (`npm run build`)**

Run: `21st review src/app --json` and `npm run build`
Expected: `21st review src/app --json` returns `"summary": { "errors": 0, "warnings": 0, "suggestions": 0 }` across all 129 files in `src/app/`, and `npm run build` exits with code `0`.

- [x] **Step 4: Commit**

```bash
git add src/styles.css src/app/pages .21st/design.json
git commit -m "feat(ui): complete 21st token alignment across all institutional trust pages"
```

