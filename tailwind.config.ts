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
        background: "#050505",
        surface: "#050505",
        "surface-dim": "#050505",
        "surface-card": "#111111",
        "surface-high": "#181818",
        border: "#2D2D2D",
        outline: "#8b919b",
        "outline-variant": "#414750",
        text: "#F5F5F0",
        muted: "#A7A7A7",
        primary: "#FFC700",
        "primary-strong": "#FFD400",
        secondary: "#4DE082",
        tertiary: "#FFB100",
        danger: "#FF8A80",
        "danger-solid": "#A00000",

        // Add additional v2 color tokens
        "on-tertiary-fixed": "#231b00",
        "surface-tint": "#FFC700",
        "inverse-primary": "#FFB800",
        "error-container": "#400000",
        "on-primary-fixed-variant": "#665000",
        "on-primary-fixed": "#000000",
        "on-secondary-container": "#003e1c",
        "primary-fixed": "#FFE14D",
        "on-error-container": "#ffdad6",
        "primary-container": "#665000",
        "on-surface": "#F5F5F0",
        "primary-fixed-dim": "#FFC700",
        "tertiary-fixed-dim": "#FFB100",
        "surface-variant": "#242424",
        "surface-container-high": "#181818",
        "on-tertiary-container": "#6B4500",
        "surface-container-lowest": "#090909",
        "secondary-container": "#35D56A",
        "inverse-surface": "#F5F5F0",
        "on-secondary": "#003919",
        "secondary-fixed-dim": "#35D56A",
        "on-primary-container": "#FFD400",
        "inverse-on-surface": "#111111",
        "on-tertiary-fixed-variant": "#6B4500",
        "on-primary": "#000000",
        "surface-container": "#111111",
        "surface-container-low": "#111111",
        "on-tertiary": "#3c2f00",
        "on-error": "#690005",
        "on-secondary-fixed-variant": "#005227",
        "surface-container-highest": "#242424",
        "tertiary-container": "#6B4500",
        "on-secondary-fixed": "#00210c",
        "surface-bright": "#181818",
        error: "#FF8A80",
        "secondary-fixed": "#74FF9D",
        "on-background": "#F5F5F0",
        disabled: "#6B6B6B",
        "border-strong": "#3F3F3F",
        "primary-hover": "#FFE14D",
        "primary-active": "#FFB800",

        // Retain homepage brand color tokens to ensure safety
        "brand-charcoal": "#050505",
        "brand-sapphire": "#FFD400",
        "brand-sapphire-glow": "rgba(255, 212, 0, 0.4)",
        "brand-surface-lowest": "#050505",
        "brand-surface-high": "#181818",
        "brand-surface-low": "#111111",
        "brand-on-surface-variant": "#A7A7A7"
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
