import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Base Studio design tokens — see /docs/design-system.md
        ink: "#0A0E14",      // primary background, deep graphite-blue (not pure black)
        surface: "#12161F",  // card / panel surface
        surface2: "#181D28", // elevated surface (modals, dropdowns)
        line: "#232936",     // hairline borders
        muted: "#8B93A7",    // secondary text on dark
        fog: "#5B6274",      // tertiary text, placeholders
        base: "#0052FF",     // primary accent — Base's own protocol blue
        baseDim: "#0A2A80",  // pressed / dim state of primary accent
        signal: "#C4F135",   // activation / mint / "live" accent (electric lime)
        danger: "#FF5D5D",   // burn / freeze / destructive
        paper: "#F4F1EA",    // rare light-mode surface, used sparingly (whitepaper export view)
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "16px",
      },
      keyframes: {
        "console-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
      },
      animation: {
        "console-blink": "console-blink 1s step-end infinite",
      },
    },
  },
  plugins: [],
};

export default config;
