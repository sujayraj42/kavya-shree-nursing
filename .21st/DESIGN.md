# 21st Design System Context — Kavya Shree Institute of Nursing

## 1. Brand & Aesthetic Identity
- **Product Type**: Institutional Higher Education & Nursing Admissions Portal (`kavya-shree-nursing`)
- **Stack**: Angular 22 (Standalone + Signals), Bootstrap 5 Grid, CSS Custom Properties (`src/styles.css`)
- **Visual Direction**: High-contrast institutional authority — Eerie Black (`#181818`), Carrot Orange (`#eb9624`), Academic Blue (`#124e9d`), and crisp `4px` (`--round-4`) geometry.

## 2. Core Tokens (`src/styles.css` & `DESIGN_TOKENS.md`)
- `--color--eeire-black`: `#181818` (Header, footer, dossier bars)
- `--color--carrot-orange`: `#eb9624` (Primary CTA buttons, active states, focus rings)
- `--color--blue` / `--ks-academic-blue`: `#124e9d` (Secondary academic links, badges)
- `--color--gray`: `#4f4f4f` (Primary body copy)
- `--color--gray-light`: `#6e7074` (Subdued metadata)
- `--color--white`: `#ffffff` (Surface canvas)
- `--ks-bg-paper`: `#fafafa` (Alternating section background)
- `--ks-bg-stone`: `#f4f4f4` (Container contrast surface)
- `--ks-rule`: `#e5e5e5` / `--ks-rule-strong`: `#d0d0d0` (Crisp institutional rules)
- `--font--lora`: `"Lora", Georgia, "Times New Roman", serif` (Headings `.h1-heading`..`.h4-heading`)
- `--font--sans`: `Arial, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` (Body & UI)

## 3. Strict Constraints
- **Must**:
  - Maintain `48px x 48px` minimum touch targets on mobile navigation and floating actions.
  - Provide `rel="noopener noreferrer"` on all `target="_blank"` anchors.
  - Provide `aria-modal="true"`, `aria-labelledby`, accessible close labels, and `Escape` key dismissal on all modal dialogs.
  - Honor `prefers-reduced-motion: reduce` globally.
- **Avoid**:
  - Purple-to-blue gradients, gradient hero text, glassmorphism, or colored left-border cards.
  - Emojis in headings, generic buzzwords, or unapproved fonts (Inter, Space Grotesk, Instrument Serif).
