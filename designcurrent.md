# SheetStride Current Design System Specs

This document compiles the complete typography, colors, and styling patterns utilized across the **SheetStride** cyberpunk interview preparation platform.

---

## 1. Typography & Fonts

SheetStride uses a mix of modern sans-serif fonts, classic monospace programming fonts, and retro-themed pixel typography to establish its cyberpunk/terminal aesthetic.

### Font Families
| Token | Font Family | Fallback | Primary Usage |
| :--- | :--- | :--- | :--- |
| **`display` / `press-start`** | `'Press Start 2P'` | `monospace` | Section headings, HUD indicators, system status text |
| **`body` / `mono-label`** | `'JetBrains Mono'` | `monospace` | Monospace tags, code segments, raw values, labels |
| **`data` / `vt323`** | `'VT323'` | `monospace` | Highlighted numeric statistics, count numbers |
| **`sans`** | `'Inter'` | `sans-serif` | Core layout text, descriptions, details |
| **`headline-lg` / `body-lg`** | `'Space Grotesk'` | `sans-serif` | Main content paragraphs, page headers, body text |

### Typography Styles & Sizing
*   **`display-hero`**: `32px` / line-height: `48px`
*   **`headline-lg`**: `32px` / line-height: `40px` (Weight: `700`, Letter-spacing: `-0.02em`)
*   **`headline-lg-mobile`**: `24px` / line-height: `32px` (Weight: `700`)
*   **`headline-md`**: `20px` / line-height: `28px` (Weight: `600`)
*   **`headline-sm`**: `12px` / line-height: `16px`
*   **`body-lg`**: `16px` / line-height: `24px` (Weight: `400`)
*   **`body-sm`**: `14px` / line-height: `20px` (Weight: `400`)
*   **`mono-stats`**: `18px` / line-height: `24px` (Weight: `700`)
*   **`mono-label`**: `13px` / line-height: `16px` (Weight: `500`, Letter-spacing: `0.02em`)
*   **`data-lg`**: `36px` / line-height: `40px`
*   **`data-md`**: `24px` / line-height: `28px`
*   **`label-caps`**: `11px` / line-height: `16px` (Letter-spacing: `0.05em`)

---

## 2. Color Palette (Theme Tokens)

All colors map directly to class utilities defined in `tailwind.config.ts` and variable references inside `app/globals.css`.

### Core Backgrounds & Surfaces
| Token Name | Hex Code | Purpose / Context |
| :--- | :--- | :--- |
| **`background`** | `#050505` | Deep pitch-black page background |
| **`surface` / `surface-dim`**| `#050505` | Baseline dark theme background sheets |
| **`surface-card`** | `#111111` | Standard content panels and card wraps |
| **`surface-high`** | `#181818` | Slightly elevated surface highlights |
| **`surface-container`** | `#111111` | Shared containers |
| **`surface-variant`** | `#242424` | Contrast surface wrappers |
| **`surface-container-lowest`**| `#090909` | Ultra-dark backing sheets (used in tables) |

### Core Accent Colors
| Accent | Hex Code | System Meaning / Tone |
| :--- | :--- | :--- |
| **`primary`** | `#FFC700` | Cyberpunk Yellow / Brand Highlights |
| **`primary-strong`** | `#FFD400` | Bright Amber Yellow (Default highlights, selection background) |
| **`secondary`** | `#4DE082` | Neon Green / Success, Solved statuses, active streaks |
| **`tertiary`** | `#FFB100` | Warm Orange/Gold / Medium Difficulty markers |
| **`danger` / `error`** | `#FF8A80` | Pastel Neon Red / Alert status, Hard difficulty, errors |
| **`danger-solid`** | `#A00000` | Deep Red fill background |

### Text & Borders
| Color | Hex Code | Description |
| :--- | :--- | :--- |
| **`text` / `on-surface`** | `#F5F5F0` | Main light-grey/white readable text |
| **`muted`** | `#A7A7A7` | Secondary text, descriptions, captions |
| **`outline`** | `#8b919b` | Standard borders, inactive markers |
| **`outline-variant`** | `#414750` | Muted divider borders, grid lines |
| **`border`** | `#2D2D2D` | Default outline border for panels |
| **`border-strong`** | `#3F3F3F` | High-contrast borders |
| **`disabled`** | `#6B6B6B` | Locked/inactive states |

### Brand (Legacy / Homepage Safeguards)
*   **`brand-charcoal`**: `#050505`
*   **`brand-sapphire`**: `#FFD400`
*   **`brand-sapphire-glow`**: `rgba(255, 212, 0, 0.4)`
*   **`brand-surface-lowest`**: `#050505`
*   **`brand-surface-high`**: `#181818`
*   **`brand-surface-low`**: `#111111`
*   **`brand-on-surface-variant`**: `#A7A7A7`

---

## 3. Custom CSS UI Elements & Effects

The following core classes are defined globally in [globals.css](file:///c:/Users/Akshat/Desktop/SheetStride_at2/app/globals.css) to enforce premium cyberpunk visuals:

### A. Terminal Grids & Scanlines
*   **`.terminal-grid`**: Radial overlay grid of micro-dots (`rgba(255, 212, 0, 0.08)` size `24px` x `24px`).
*   **`.code-grid`**: Box-outline coding layout lines (`#0E0E0E` size `40px` x `40px`).
*   **`.scanline`**: Scanning beam that runs down the viewport (`primary/5` overlay animate).

### B. Cards & Panels
*   **`.glass-card`**: Glassmorphism container with backdrop-blur (`12px`) and subtle transparent charcoal background (`rgba(17,17,17,0.72)`). Glows and floats up slightly on hover.
*   **`.retro-panel`**: Hard border panel (`#2D2D2D`) with card surface fill (`#111111`).
*   **`.retro-section-header`**: Accent header bar with small display fonts.

### C. Controls & Inputs
*   **`.sharp-input`**: Sleek terminal input with dark backing (`#0A0A0A`). Glows yellow (`#FFD400`) on focus.
*   **`.sharp-button-primary`**: High contrast action button (`#FFD400`) with text color (`#000000`). Features hover glow shadow effects.

### D. Cyberpunk Animations
*   **`.glitch-text`**: Glitches color channels (RGB text-shadows) on intervals.
*   **`.glitch-hover`**: Adds a quick double-colored shadow on hover.
*   **`.skeleton`**: Content loading shimmer using high-contrast dark gradients (`#111111` to `#181818`).
*   **`.pacman-chomper`**: Fun easter egg animation containing a Pacman icon munching food dots.
