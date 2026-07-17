# SheetStride Typography System

This document outlines the standard typography design system, font families, and size scales used across the **SheetStride** platform.

---

## 1. Font Families & Imports

Fonts are loaded from Google Fonts in [app/globals.css](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/globals.css#L1):

```css
@import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;700&family=Press+Start+2P&family=VT323&family=Inter:wght@300;400;500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap");
```

### Font Stack Configurations
Mapped in `tailwind.config.ts` under `theme.extend.fontFamily`:

| Token | CSS Font Families | Style Role |
| :--- | :--- | :--- |
| `font-display` | `'Press Start 2P'`, `monospace` | Retro arcade titles, headers, and UI widgets |
| `font-body` | `'JetBrains Mono'`, `monospace` | Monospace source code snippets and inputs |
| `font-data` | `VT323`, `monospace` | Terminal telemetry stats and graphs |
| `font-sans` | `Inter`, `sans-serif` | General marketing landing pages and clean copy text |
| `font-headline-lg` | `'Space Grotesk'`, `sans-serif` | Large page headers and analytics banners |
| `font-headline-md` | `'Space Grotesk'`, `sans-serif` | Panel titles, modal headers, card titles |
| `font-body-lg` | `'Space Grotesk'`, `sans-serif` | Main readable body paragraphs |
| `font-body-sm` | `'Space Grotesk'`, `sans-serif` | Secondary sub-text, help texts |
| `font-mono-label` | `'JetBrains Mono'`, `monospace` | Technical badges, small status logs |
| `font-mono-stats` | `'JetBrains Mono'`, `monospace` | Numeric trackers, streaks, performance tags |

---

## 2. Standardized Font Size Hierarchy Scale

Mapped in `tailwind.config.ts` under `theme.extend.fontSize`:

| Tailwind Size Token | font-size | line-height | Font Weight / Notes |
| :--- | :--- | :--- | :--- |
| `text-app-logo` | `34px` | `42px` | Weight 400, Letter-spacing `0.08em` |
| `text-page-title` | `30px` | `38px` | Weight 700, Letter-spacing `-0.02em` |
| `text-section-title` | `24px` | `32px` | Weight 600 |
| `text-card-title` | `20px` | `28px` | Weight 600 |
| `text-subsection-title`| `18px` | `26px` | Weight 500 |
| `text-body-md` | `15px` | `22px` | Weight 400 |
| `text-badge-sm` | `12px` | `16px` | Weight 500 |
| `text-display-hero` | `32px` | `48px` | Homepage hero headers |
| `text-data-lg` | `36px` | `40px` | Large terminal numeric meters |
| `text-data-md` | `24px` | `28px` | Medium terminal stats |
| `text-label-caps` | `11px` | `16px` | Letter-spacing `0.05em`, uppercase |

---

## 3. Usage Guidelines

1.  **Arcade / Terminal Theme:** Use `font-display` (`Press Start 2P`) sparingly for tiny status badges, scan-line telemetry labels, and retro panels.
2.  **Telemetry Numbers:** Use `font-data` (`VT323`) or `font-mono-stats` (`JetBrains Mono`) for all counters, graphs, metrics, and streak metrics.
3.  **Default Text:** The default body is styled using `'Space Grotesk'` (sans-serif) for high legibility combined with cyberpunk tech aesthetics.
4.  **No Custom Inline Sizes:** Rely strictly on Tailwind tokens (e.g. `text-page-title`, `text-card-title`, `text-body-md`, `text-badge-sm`) to enforce visual layout consistency.
