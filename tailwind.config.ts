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
        background: "#0B0B0B",
        surface: "#111415",
        "surface-dim": "#151515",
        "surface-card": "#1E1E1E",
        "surface-high": "#252525",
        border: "#2A2A2A",
        outline: "#414751",
        text: "#E1E2E4",
        muted: "#C1C7D3",
        primary: "#A4C9FF",
        "primary-strong": "#60A5FA",
        secondary: "#4AE176",
        tertiary: "#F7BE1D",
        danger: "#FFB4AB",
        "danger-solid": "#93000A",
        "brand-charcoal": "#111317",
        "brand-sapphire": "#2e5bff",
        "brand-sapphire-glow": "rgba(46, 91, 255, 0.4)",
        "brand-surface-lowest": "#0c0e12",
        "brand-surface-high": "#282a2e",
        "brand-surface-low": "#1a1c20",
        "brand-on-surface-variant": "#c4c5d9"
      },
      fontFamily: {
        display: ["'Press Start 2P'", "monospace"],
        body: ["'JetBrains Mono'", "monospace"],
        data: ["VT323", "monospace"],
        sans: ["Inter", "sans-serif"],
        "press-start": ["'Press Start 2P'", "monospace"],
        vt323: ["'VT323'", "monospace"]
      },
      fontSize: {
        "display-hero": ["32px", { lineHeight: "48px" }],
        "headline-lg": ["20px", { lineHeight: "32px" }],
        "headline-sm": ["12px", { lineHeight: "16px" }],
        "data-lg": ["36px", { lineHeight: "40px" }],
        "data-md": ["24px", { lineHeight: "28px" }],
        "body-lg": ["16px", { lineHeight: "24px" }],
        "body-md": ["14px", { lineHeight: "20px" }],
        "label-caps": ["11px", { lineHeight: "16px", letterSpacing: "0.05em" }]
      },
      spacing: {
        gutter: "20px",
        "margin-mobile": "16px",
        "margin-desktop": "40px"
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
