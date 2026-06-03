---
name: SheetStride
colors:
  surface: '#111415'
  surface-dim: '#111415'
  surface-bright: '#37393b'
  surface-container-lowest: '#0c0f10'
  surface-container-low: '#191c1e'
  surface-container: '#1d2022'
  surface-container-high: '#282a2c'
  surface-container-highest: '#323537'
  on-surface: '#e1e2e4'
  on-surface-variant: '#c1c7d3'
  inverse-surface: '#e1e2e4'
  inverse-on-surface: '#2e3132'
  outline: '#8b919d'
  outline-variant: '#414751'
  surface-tint: '#a4c9ff'
  primary: '#a4c9ff'
  on-primary: '#00315d'
  primary-container: '#60a5fa'
  on-primary-container: '#003a6b'
  inverse-primary: '#0060ac'
  secondary: '#4ae176'
  on-secondary: '#003915'
  secondary-container: '#00b954'
  on-secondary-container: '#004119'
  tertiary: '#f7be1d'
  on-tertiary: '#3f2e00'
  tertiary-container: '#cc9b00'
  on-tertiary-container: '#493600'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d4e3ff'
  primary-fixed-dim: '#a4c9ff'
  on-primary-fixed: '#001c39'
  on-primary-fixed-variant: '#004883'
  secondary-fixed: '#6bff8f'
  secondary-fixed-dim: '#4ae176'
  on-secondary-fixed: '#002109'
  on-secondary-fixed-variant: '#005321'
  tertiary-fixed: '#ffdf9a'
  tertiary-fixed-dim: '#f7be1d'
  on-tertiary-fixed: '#251a00'
  on-tertiary-fixed-variant: '#5a4300'
  background: '#111415'
  on-background: '#e1e2e4'
  surface-variant: '#323537'
typography:
  display-hero:
    fontFamily: Press Start 2P
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Press Start 2P
    fontSize: 20px
    fontWeight: '400'
    lineHeight: 32px
  headline-sm:
    fontFamily: Press Start 2P
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-lg:
    fontFamily: VT323
    fontSize: 36px
    fontWeight: '400'
    lineHeight: 40px
  data-md:
    fontFamily: VT323
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 28px
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style

The design system is engineered for developers who value performance, precision, and a nostalgic nod to the golden age of computing. The aesthetic is a fusion of **Modern Minimalism** and **Retro-Terminal**, creating a high-contrast, low-distraction environment optimized for deep work.

The brand personality is authoritative yet approachable—functioning like a high-end IDE. It avoids soft gradients and glassmorphism in favor of sharp lines, solid fills, and intentional whitespace. The emotional response should be one of "system readiness": efficient, technical, and premium. Key visual motifs include 1px borders, monospaced data displays, and a strict adherence to a "dark mode first" philosophy.

## Colors

This design system utilizes a "Deep Charcoal" palette to reduce eye strain during long sessions. The hierarchy is established through surface luminance rather than color. 

- **Primary Background (#0B0B0B):** Used for the main canvas and application backdrop.
- **Secondary/Surface (#151515 - #1E1E1E):** Used to differentiate sidebars, panels, and cards.
- **Accent Blue (#60A5FA):** Reserved for primary actions, focus states, and active navigation indicators.
- **Semantic Colors:** Green, Yellow, and Red are used sparingly for status indicators (Success, Warning, Danger) to maintain a professional, utility-first appearance.
- **Borders (#2A2A2A):** Crucial for defining structure in a low-light environment without relying on shadows.

## Typography

Typography is the core of this design system’s identity. It uses three distinct font families to categorize information:

1.  **Press Start 2P (Branding & Headers):** Used for high-level impact. Due to its high character width, keep text short. Use for the logo, hero titles, and rare "Special" labels.
2.  **VT323 (Statistics & Numbers):** The "Data" font. Used for anything purely numerical—streaks, timers, counters, and progress percentages. It evokes a terminal read-out.
3.  **JetBrains Mono (Utility & Content):** The workhorse font. Used for all navigation, body text, lists, and button labels. It ensures maximum legibility and a developer-centric feel.

**Scaling Note:** For mobile, `display-hero` should scale down to 18px to maintain the pixel-grid integrity without breaking the layout.

## Layout & Spacing

The design system follows a rigid **4px baseline grid**, ensuring all elements align to a technical rhythm. 

- **Grid System:** A 12-column fixed-fluid hybrid grid. On desktop, the main content area has a max-width of 1280px.
- **Gutters:** Standardized at 20px (5 units) to create clear separation between data panels.
- **Container Strategy:** Elements should feel "slotted" into the UI. Use 1px solid borders for all container divisions. 
- **Responsive Behavior:** 
  - **Desktop (1024px+):** Full 12-column display with persistent sidebars.
  - **Tablet (768px - 1023px):** Sidebars collapse into icons or hide behind a "command palette" interface. 
  - **Mobile (<768px):** Single column stack. Margin reduces to 16px. Typography scales down slightly for high-density information.

## Elevation & Depth

This design system avoids shadows entirely. Depth is achieved through **Tonal Layering** and **1px Outlines**.

- **Level 0 (Background):** `#0B0B0B` - The furthest back layer.
- **Level 1 (Sub-navigation/Sidebar):** `#151515` - Distinguished by a subtle shift in grey.
- **Level 2 (Cards/Main Content):** `#1E1E1E` - The primary interaction surface.
- **Visual Cues:** Instead of elevation shadows, use `#2A2A2A` 1px borders to define edges. For active or "focused" elements, change the border color to the Accent Blue (`#60A5FA`).
- **Hover States:** Use the Hover Surface (`#252525`) to indicate interactivity. Do not use "lift" or "pop" transitions; use immediate color shifts to mimic terminal performance.

## Shapes

To maintain the terminal/IDE aesthetic, all primary UI elements use **0px (Sharp)** corners. 

Rounded corners contradict the pixel-perfect, technical nature of the system. Buttons, input fields, cards, and dropdowns must be perfectly rectangular. 

The only exception to this "Sharp" rule is for specific data-visualization icons or user avatars, which may be treated as squares with 1px internal "pixel-cut" corners if necessary for brand distinction, though 90-degree angles are the strong preference.

## Components

### Buttons
- **Primary:** Solid `#60A5FA` background with `#0B0B0B` text. No border.
- **Secondary:** Transparent background with a 1px `#2A2A2A` border. Text is `#F3F4F6`.
- **Ghost:** No background or border. Text is `#9CA3AF`, turning `#F3F4F6` on hover.
- **Interactions:** On hover, primary buttons should darken slightly. Secondary buttons should change border color to `#60A5FA`.

### Input Fields
- **Default:** `#151515` background, 1px `#2A2A2A` border. Text is `JetBrains Mono`.
- **Focus:** Border changes to `#60A5FA`. A blinking 2px vertical bar (accent color) can be used as the cursor to reinforce the terminal theme.

### Cards & Panels
- Background: `#1E1E1E`. Border: 1px `#2A2A2A`.
- Header: A separate 1px bottom border within the card, using a slightly darker `#151515` for the header background to create a "tabbed" appearance.

### Chips & Tags
- Rectangular blocks. Small `JetBrains Mono` text.
- Use low-opacity versions of semantic colors (e.g., Success Green at 10% opacity) with a solid 1px border of the full-strength color.

### Progress Bars
- Background: `#2A2A2A`. Fill: `#60A5FA`.
- For a "Retro" feel, use segmented fills (blocks) instead of a continuous smooth bar.