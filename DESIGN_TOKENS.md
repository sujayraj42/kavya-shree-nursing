# Design Tokens: Kavya Shree Institute of Nursing

> Extracted from `src/styles.css`, `src/styles.scss`, and existing page components (`home`, `about`, `programs`, `admissions`, `contact`).
> These tokens represent the final, approved visual system. Every new feature must reuse these exact classes, variables, and geometry.

---

## 1. Palette & Colors

| Token / Variable | Value | Purpose / Usage |
|---|---|---|
| `--color--eeire-black` | `#181818` | Primary dark background, navbar, footer, dossier headers |
| `--color--carrot-orange` | `#eb9624` | Primary brand accent, active tabs, CTA buttons, focus rings |
| `--color--blue` / `--ks-academic-blue` | `#124e9d` | Secondary academic blue, links, informational badges |
| Theme Navy | `#0f2942` | Institutional deep navy variant / contrast base |
| `--color--gray` | `#4f4f4f` | Primary body typography (readable contrast) |
| `--color--gray-light` | `#6e7074` | Subdued secondary text, captions, timestamps |
| `--color--white` | `#ffffff` | Canvas surface, clean card backgrounds |
| `--ks-bg-paper` | `#fafafa` | Alternate section background |
| `--ks-bg-stone` | `#f4f4f4` / `#f7f7f7` | Subtle contrast container background |
| `--ks-rule` | `#e5e5e5` | Subtle border and dividers |
| `--ks-rule-strong` | `#d0d0d0` | Stronger card / table borders |
| `--ks-provisional-bg` | `#fff9ed` | Warning / provisional notice background |
| `--ks-provisional-border` | `#fed89b` | Warning / provisional notice border |
| `--ks-provisional-text` | `#7a4b04` | Warning / provisional notice text |

---

## 2. Typography

| Role | Font Family Token | Stack |
|---|---|---|
| **Headings** | `--font--lora` / `--ks-font-serif` | `"Lora", Georgia, "Times New Roman", serif` |
| **Body & UI** | `--font--sans` / `--font--jakarta-sans` | `Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif` |

### Scale & Hierarchy
- `.h1-heading`: `2.75rem` (44px), weight 600, line-height 1.22
- `.h2-heading`: `2.125rem` (34px), weight 600, line-height 1.3
- `.h3-heading` / `.list-heading`: `1.5rem` (24px), weight 600, line-height 1.35
- `.h4-heading` / `.heading-h4`: `1.25rem` (20px), weight 600, line-height 1.4
- Body copy (`body`, `.paragraph`): `18px` (`1.125rem`), line-height 1.6, weight 400
- Small UI (`.small`, `.para-small`): `15px` / `0.875rem`, line-height 1.5
- Micro UI (`.extra-small-para`): `12px` / `0.75rem`, line-height 1.4

---

## 3. Geometry & Spacing

| Property | Value | Description |
|---|---|---|
| **Border Radius** | `var(--round-4)` = `4px` | Standard institutional crisp radius |
| **Pill Radius** | `50px` / `round-pill` | Tabs, status chips, floating action buttons |
| **Section Padding (Desktop)** | `80px 0 70px 0` | Standard `.general-section`, `.hero-section` |
| **Section Padding (Mobile)** | `48px 0 40px 0` | Mobile viewport rhythm |
| **Max Container Width** | `1320px` (`container-xxl`) | Bootstrap responsive grid |
| **Shadow (Default)** | `0 4px 12px rgba(0, 0, 0, 0.05)` | Standard card elevation |
| **Shadow (Elevated)** | `0 12px 30px rgba(0, 0, 0, 0.15)` | Form box, modal, dropdown elevation |
| **Shadow (Hero Card)** | `0 16px 36px rgba(0, 0, 0, 0.4)` | Hero image frame |

---

## 4. Breakpoints

- Mobile (Compact): `< 576px` (`xs`) — target `360px`
- Mobile (Landscape) / Phablet: `≥ 576px` (`sm`)
- Tablet: `≥ 768px` (`md`) — target `768px`
- Desktop: `≥ 992px` (`lg`)
- Wide Desktop: `≥ 1200px` (`xl`) — target `1280px`
- Extra Wide: `≥ 1400px` (`xxl`)

---

## 5. Reusable Component Classes

### Buttons
- `.button` / `.btn-institutional-primary`: Solid accent (`--color--carrot-orange`), dark text, crisp 4px radius, hover brightness shift.
- `.secondary-button` / `.btn-institutional-outline`: Transparent background, white or dark border (1.5px), hover fill.
- `.white-button`: Clean white card CTA with dark text.
- Minimum interactive tap target: `48px x 48px` on touch viewports.

### Cards & Frames
- `.ks-visual-card`: Crisp bordered card with dark header (`--color--eeire-black`), white body, 4px radius.
- `.card`: Bordered, clean white canvas with `border-color: #e0e0e0` or `var(--ks-rule)`.
- `.hero-image-card`: Dark slate frame with subtle border and deep shadow.

### Form Inputs
- Border: `1px solid #d0d0d0`, border-radius: `4px`, padding: `0.65rem 0.85rem`.
- Focus state: `outline: none; box-shadow: var(--ks-focus-ring) !important; border-color: var(--color--carrot-orange);`.
- Required indicator: Red asterisk with accessible label.

### Badges & Kicker
- `.ks-section-kicker`: Uppercase, tracking-wide, bold, carrot orange text (`--color--carrot-orange`), font size `0.8125rem`.
- `.ks-badge-provisional`: Yellow-amber badge with dark amber text.
- `.badge`: Crisp pill or rounded badge with uppercase tracking.
