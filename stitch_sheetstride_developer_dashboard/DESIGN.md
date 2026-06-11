---
name: SheetStride Refined
colors:
  surface: '#111317'
  surface-dim: '#111317'
  surface-bright: '#37393e'
  surface-container-lowest: '#0c0e12'
  surface-container-low: '#1a1c20'
  surface-container: '#1e2024'
  surface-container-high: '#282a2e'
  surface-container-highest: '#333539'
  on-surface: '#e2e2e8'
  on-surface-variant: '#c4c5d9'
  inverse-surface: '#e2e2e8'
  inverse-on-surface: '#2f3035'
  outline: '#8e90a2'
  outline-variant: '#434656'
  surface-tint: '#b8c3ff'
  primary: '#b8c3ff'
  on-primary: '#002388'
  primary-container: '#2e5bff'
  on-primary-container: '#efefff'
  inverse-primary: '#124af0'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#4edea3'
  on-tertiary: '#003824'
  tertiary-container: '#007d55'
  on-tertiary-container: '#bdffdb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c3ff'
  on-primary-fixed: '#001356'
  on-primary-fixed-variant: '#0035be'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#111317'
  on-background: '#e2e2e8'
  surface-variant: '#333539'
typography:
  display-lg:
    fontFamily: JetBrains Mono
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: JetBrains Mono
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.05em
  code-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '450'
    lineHeight: '1.5'
    letterSpacing: 0em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  container-padding: 32px
  gutter: 24px
---

## Brand & Style

The design system is a sophisticated fusion of high-end editorial aesthetics and technical precision. It bridges the gap between "Developer Tool" and "Luxury Workspace," targeting users who value both functional efficiency and atmospheric depth. The brand personality is authoritative yet welcoming, characterized by a "Rich Technicality" that feels more like a premium studio than a cold terminal.

The design style is a hybrid of **Minimalism** and **Glassmorphism**, leaning heavily into "Tonal Layering." By moving away from pure blacks and whites, the system creates a sense of physical space and material quality. The emotional response should be one of calm focus, high-performance capability, and tactile refinement.

## Colors

This design system utilizes two distinct but harmonious palettes. 

The **Dark Theme** avoids pure #000000. It uses a deep charcoal base (`#0F1115`) with subtle blue-gray undertones to create a "Midnight Studio" feel. Surfaces are layered using slightly lighter shades to suggest depth. The accent blue is a refined Sapphire (`#3D7EFC`), offering vibrant energy without the fatigue of neon.

The **Light Theme** shifts from flat white to a sophisticated "Bone" or "Cool Gray" base (`#F4F5F7`). This reduces glare and increases the perceived quality of the interface. Surfaces are kept clean white, creating a "floating paper" effect against the slightly darker background.

Both themes utilize a strict hierarchy of grays:
- **Primary Text:** High contrast for peak legibility.
- **Secondary Text:** Softened grays (`#94A3B8` in dark, `#64748B` in light) to reduce visual noise in dense data layouts.

## Typography

The system utilizes **JetBrains Mono** as the primary typeface to maintain a developer-centric, technical soul. However, to achieve an "elegant" feel, we employ specific adjustments:
- **Weighting:** We avoid extreme weights. Headlines use a balanced 600 weight for authority without bulk.
- **Tracking:** Body text uses standard tracking, but display levels use slightly negative tracking (`-0.01em` to `-0.02em`) to feel more compact and "editorial."
- **Labels:** Small labels use increased letter spacing (`0.05em`) and uppercase styling to provide clear structural markers.

**Press Start 2P** should be reserved strictly for micro-interactions, brand accents (like logos or small decorative badges), and specific achievement states, ensuring it doesn't compromise the modern legibility of the core workspace.

## Layout & Spacing

The layout philosophy is built on **Generous Precision**. While the grid is technical and rigid, the whitespace is expansive. We use a 12-column fluid grid for the main stage, with fixed-width sidebars (280px) to ground the interface.

**Spacing Rhythm:**
- Use `xl` (40px) and `xxl` (64px) for major section separation to evoke "elegance."
- Use `md` (16px) for internal component padding.
- For data-heavy tables, use a "breathable" row height (minimum 48px) to prevent the "spreadsheet fatigue" common in technical tools.

## Elevation & Depth

Depth is handled differently per theme to maximize the specific strengths of each:

**Dark Theme (Inner Glow):**
Instead of traditional drop shadows, depth is conveyed through **"Inner-line" details**. Cards and modals should feature a 1px border with a very subtle top-down gradient (e.g., a slightly lighter blue-gray at the top edge). This mimics the way light catches the bevel of a high-end physical hardware device.

**Light Theme (Floating Paper):**
The light theme relies on **Multi-layered Soft Shadows**. Surfaces do not use hard borders. Instead, they use a compound shadow:
1. A very broad, low-opacity ambient occlusion (Blur: 30px, Opacity: 4%).
2. A sharper, slightly tighter shadow (Blur: 10px, Opacity: 6%) to define the object's edge.
This creates a "floating" effect that feels premium and lightweight.

## Shapes

The shape language is defined as **Technical Softness**. We use a base roundedness of **4px (`0.25rem`)** for most UI elements. This provides enough softening to feel "modern" and "refined" while maintaining the sharp, terminal-inspired edge that developers expect.

- **Small Components (Buttons, Chips):** 4px radius.
- **Medium Components (Cards, Modals):** 8px (`rounded-lg`) to 12px (`rounded-xl`).
- **Interactive Elements:** Active states should never be fully circular unless they are iconic (like avatars). Keep the "squircle" feel throughout.

## Components

### Buttons
Primary buttons use the Sapphire accent with white text. In the Dark theme, add a subtle inner-glow to the top edge. Secondary buttons should be "ghost" style in the Dark theme (border only) and "filled-tonal" in the Light theme (very light gray background).

### Cards
Cards are the primary container.
- **Dark:** Background `#1A1D23`, 1px border `#2D333F`, 4px corner radius. Add a 1px inner-top-border in the accent color at 20% opacity for "Gold Tier" features.
- **Light:** Background `#FFFFFF`, no border, multi-layered soft shadow, 8px corner radius.

### Input Fields
Inputs should feel like a "command line" but refined. Use JetBrains Mono for the text. Active states should use a 2px left-border accent color, creating a "cursor" metaphor for the entire field.

### Chips & Tags
Technical tags should use a monospace font at `label-sm` size. Use low-saturation background tints (e.g., 10% opacity of the accent color) to keep them from cluttering the visual hierarchy.

### Lists & Tables
Rows should have a hover state that uses a subtle surface shift (`+2%` lightness in dark, `-2%` in light). Avoid dividers between every row; use whitespace to separate items, only using dividers for primary logical sections.