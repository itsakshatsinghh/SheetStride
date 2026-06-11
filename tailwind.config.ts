import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Core background and surface v2 colors
        background: "#131313",
        surface: "#131313",
        "surface-dim": "#131313",
        "surface-card": "#1C1C1C",
        "surface-high": "#222222",
        border: "#2B2B2B",
        outline: "#8b919b",
        "outline-variant": "#414750",
        text: "#E5E2E1",
        muted: "#c1c7d2",
        primary: "#b2d2ff",
        "primary-strong": "#7cb8ff",
        secondary: "#4de082",
        tertiary: "#f9cb13",
        danger: "#ffb4ab",
        "danger-solid": "#93000a",

        // Add additional v2 color tokens
        "on-tertiary-fixed": "#231b00",
        "surface-tint": "#a0c9ff",
        "inverse-primary": "#1461a2",
        "error-container": "#93000a",
        "on-primary-fixed-variant": "#00497f",
        "on-primary-fixed": "#001c37",
        "on-secondary-container": "#003e1c",
        "primary-fixed": "#d2e4ff",
        "on-error-container": "#ffdad6",
        "primary-container": "#7cb8ff",
        "on-surface": "#e5e2e1",
        "primary-fixed-dim": "#a0c9ff",
        "tertiary-fixed-dim": "#eec200",
        "surface-variant": "#353534",
        "surface-container-high": "#2a2a2a",
        "on-tertiary-container": "#564400",
        "surface-container-lowest": "#0e0e0e",
        "secondary-container": "#00b55d",
        "inverse-surface": "#e5e2e1",
        "on-secondary": "#003919",
        "secondary-fixed-dim": "#4de082",
        "on-primary-container": "#00487e",
        "inverse-on-surface": "#313030",
        "on-tertiary-fixed-variant": "#574500",
        "on-primary": "#00325a",
        "surface-container": "#201f1f",
        "surface-container-low": "#1c1b1b",
        "on-tertiary": "#3c2f00",
        "on-error": "#690005",
        "on-secondary-fixed-variant": "#005227",
        "surface-container-highest": "#353534",
        "tertiary-container": "#d9b000",
        "on-secondary-fixed": "#00210c",
        "surface-bright": "#3a3939",
        error: "#ffb4ab",
        "secondary-fixed": "#6dfe9c",
        "on-background": "#e5e2e1",

        // Retain homepage brand color tokens to ensure safety
        "brand-charcoal": "#111317",
        "brand-sapphire": "#2e5bff",
        "brand-sapphire-glow": "rgba(46, 91, 255, 0.4)",
        "brand-surface-lowest": "#0c0e12",
        "brand-surface-high": "#282a2e",
        "brand-surface-low": "#1a1c20",
        "brand-on-surface-variant": "#c4c5d9"
      },
      fontFamily: {
        // Retain homepage fonts
        display: ["'Press Start 2P'", "monospace"],
        body: ["'JetBrains Mono'", "monospace"],
        data: ["VT323", "monospace"],
        sans: ["Inter", "sans-serif"],
        "press-start": ["'Press Start 2P'", "monospace"],
        vt323: ["'VT323'", "monospace"],

        // Add SheetStride v2 fonts
        "display-arcade": ["'Press Start 2P'", "monospace"],
        "headline-lg": ["'Space Grotesk'", "sans-serif"],
        "headline-lg-mobile": ["'Space Grotesk'", "sans-serif"],
        "headline-md": ["'Space Grotesk'", "sans-serif"],
        "body-lg": ["'Space Grotesk'", "sans-serif"],
        "body-sm": ["'Space Grotesk'", "sans-serif"],
        "mono-label": ["'JetBrains Mono'", "monospace"],
        "mono-stats": ["'JetBrains Mono'", "monospace"]
      },
      fontSize: {
        // Retain homepage ones
        "display-hero": ["32px", { lineHeight: "48px" }],
        "headline-sm": ["12px", { lineHeight: "16px" }],
        "data-lg": ["36px", { lineHeight: "40px" }],
        "data-md": ["24px", { lineHeight: "28px" }],
        "label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.05em" }],

        // Add SheetStride v2 font sizes
        "headline-lg-mobile": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "display-arcade": ["14px", { lineHeight: "24px", letterSpacing: "0.1em", fontWeight: "400" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "headline-lg": ["32px", { lineHeight: "40px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "mono-label": ["13px", { lineHeight: "16px", letterSpacing: "0.02em", fontWeight: "500" }],
        "mono-stats": ["18px", { lineHeight: "24px", fontWeight: "700" }]
      },
      spacing: {
        gutter: "1.5rem",
        "margin-mobile": "1rem",
        "margin-desktop": "2.5rem",
        "stack-sm": "0.5rem",
        "stack-md": "1rem",
        "stack-lg": "2rem",
      },
      maxWidth: {
        shell: "1280px"
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" }
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" }
        }
      },
      animation: {
        blink: "blink 1s step-end infinite",
        scan: "scan 8s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
