---
name: SheetStride Terminal
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c1c7d2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8b919b'
  outline-variant: '#414750'
  surface-tint: '#a0c9ff'
  primary: '#b2d2ff'
  on-primary: '#00325a'
  primary-container: '#7cb8ff'
  on-primary-container: '#00487e'
  inverse-primary: '#1461a2'
  secondary: '#4de082'
  on-secondary: '#003919'
  secondary-container: '#00b55d'
  on-secondary-container: '#003e1c'
  tertiary: '#f9cb13'
  on-tertiary: '#3c2f00'
  tertiary-container: '#d9b000'
  on-tertiary-container: '#564400'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d2e4ff'
  primary-fixed-dim: '#a0c9ff'
  on-primary-fixed: '#001c37'
  on-primary-fixed-variant: '#00497f'
  secondary-fixed: '#6dfe9c'
  secondary-fixed-dim: '#4de082'
  on-secondary-fixed: '#00210c'
  on-secondary-fixed-variant: '#005227'
  tertiary-fixed: '#ffe083'
  tertiary-fixed-dim: '#eec200'
  on-tertiary-fixed: '#231b00'
  on-tertiary-fixed-variant: '#574500'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-arcade:
    fontFamily: Press Start 2P
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.1em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  mono-label:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  mono-stats:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
The design system embodies a "GitHub meets retro-future arcade" aesthetic, specifically tailored for high-performance developers tackling Data Structures and Algorithms. It balances the utility of a professional IDE with the nostalgic energy of a high-fidelity terminal. 

The personality is precise, technical, and slightly playful. It utilizes a **Modern-Brutalist** foundation—characterized by clean grids and monospaced data—infused with **Glassmorphism** for the navigation and **Tactile** depth for interactive elements. The UI should feel like a premium command center: dark, immersive, and highly responsive.

**Key Visual Principles:**
- **Technical Sophistication:** Information is dense but never cluttered.
- **Nostalgic Precision:** Retro-gaming cues (pixel fonts, high-contrast accents) are used sparingly as high-end finishings rather than overbearing themes.
- **Motion-Driven:** Interaction is punctuated by staggered reveals and smooth transitions to reduce cognitive load during complex problem-solving.

## Colors
The palette is optimized for long coding sessions, utilizing a deep `#080808` obsidian base to minimize eye strain. 

- **Primary Accent (Blue):** Used for primary actions, focus states, and progress indicators.
- **Semantic Accents:** Success Green, Warning Yellow, and Danger Red follow standard DSA patterns (Accepted, Time Limit Exceeded, Wrong Answer).
- **Surface Hierarchy:** Depth is created through a four-tier grayscale system rather than heavy shadows. Each elevation step increases in lightness to guide the user's focus from the background to interactive components.

## Typography
This system uses a tri-font strategy to delineate function:
1. **Press Start 2P:** Reserved exclusively for branding, section headers, and "Level Up" notifications. It should be used at small sizes with generous tracking to maintain legibility.
2. **Space Grotesk:** The workhorse for the UI. It provides a modern, geometric clarity that balances the retro elements.
3. **JetBrains Mono:** Used for all technical data, code snippets, and performance metrics. It reinforces the developer-centric nature of the tool.

**Scaling:** Large headlines use negative letter spacing for a tighter, more "editorial" feel, while mono labels use increased tracking for better scanability in dense data views.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy on desktop to maintain the "Mission Control" feel, centering content within a 1280px container.

- **Top Navigation:** A sticky, 64px height bar with a `blur(12px)` backdrop. It serves as the primary anchor, replacing the traditional sidebar.
- **Grid System:** A 12-column grid with 24px (1.5rem) gutters.
- **Mobile Adaptation:** On mobile, the grid collapses to a single column. The navigation bar transitions from a spread layout to a simplified centered logo with a hamburger menu for secondary utilities. 
- **Rhythm:** Vertical spacing is strictly controlled using a 4px baseline, ensuring all cards and data rows align perfectly across columns.

## Elevation & Depth
Depth is communicated through **Tonal Layering** and **Subtle Glassmorphism**.

- **Nav Layer:** Highest Z-index. Uses a semi-transparent `#111111cc` background with a 1px bottom border of `#2B2B2B`.
- **Card Layer:** Cards use `#1C1C1C`. On hover, they transition to `#222222` and lift by 4px via a soft, diffused shadow (`box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5)`).
- **Outlines:** All containers use a consistent 1px solid border of `#2B2B2B`. This creates a structured, "blueprint" look that defines the terminal aesthetic without needing heavy drop shadows.

## Shapes
The design system utilizes **Soft** roundedness to bridge the gap between the blocky retro-arcade style and modern software trends.

- **Standard Elements:** 0.25rem (4px) radius for buttons and small inputs.
- **Cards & Modals:** 0.75rem (12px) radius to create a distinct container feel.
- **Pixel Elements:** Heatmap cells and specific icons should maintain a 0px radius (Sharp) to preserve the "pixel-art" integrity.

## Components

### Interactive Elements
- **Buttons:** Primary buttons use a solid Accent Blue background with black text. Hover state triggers a "glow" effect (subtle outer shadow). Secondary buttons are ghost-style with `#2B2B2B` borders.
- **Inputs:** Dark backgrounds (`#080808`) with a 1px border. On focus, the border changes to Accent Blue with a 2px "outer-glow" blur.

### Data Display
- **DSA Cards:** Information-rich containers. Header uses `mono-label` for category tags (e.g., "Linked List"). Use a "Success Green" left-border accent for solved problems.
- **Heatmap:** A GitHub-style contribution grid. Cells transition through shades of Accent Blue rather than green. Use a 2px gap between cells. On hover, cells scale up slightly (1.1x).
- **Progress Bars:** Thin (4px) tracks. The filler should have a subtle gradient from `#7CB8FF` to `#4ADE80` to represent "growth."

### Special Features
- **Easter Egg:** A 16x16px pixel-art Pac-Man appears as a loading indicator, "eating" a trail of small white dots (the progress track).
- **Transitions:** Use `cubic-bezier(0.4, 0, 0.2, 1)` for all hover transitions. Page entries should use a staggered fade-in (0.3s duration, 0.05s delay per card).