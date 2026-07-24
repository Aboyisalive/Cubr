/** @type {import('tailwindcss').Config} */

// Semantic tokens resolve through CSS variables (channels: "R G B") so a single
// class works in both light and dark — the [data-theme] attribute flips the value.
// See src/styles/globals.css for the light/dark bindings.
const semantic = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // --- Spacing (4px base unit, Section 4) ---
    spacing: {
      0: "0px",
      1: "4px",
      2: "8px",
      3: "12px",
      4: "16px",
      5: "20px",
      6: "24px",
      8: "32px",
      10: "40px",
      12: "48px",
      16: "64px",
      20: "80px",
      24: "96px",
    },
    // --- Corner radius (Section 4) ---
    borderRadius: {
      none: "0px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      "2xl": "24px",
      full: "999px",
    },
    extend: {
      colors: {
        // ---- PRIMITIVES (raw values, Section 2) ----
        brandscale: {
          50: "#FFF4ED",
          100: "#FFE4D2",
          200: "#FFC7A3",
          300: "#FFA366",
          400: "#FF8533",
          500: "#FF6B0F",
          600: "#F25700",
          700: "#C94500",
          800: "#9E3700",
          900: "#7A2B00",
        },
        neutral: {
          0: "#FFFFFF",
          50: "#F7F7F8",
          100: "#EDEEF0",
          200: "#DCDDE2",
          300: "#C2C4CB",
          400: "#9A9DA8",
          500: "#71747E",
          600: "#54565F",
          700: "#3C3E45",
          800: "#26272C",
          900: "#18191C",
          950: "#0D0E10",
        },
        // Cube-face colors — first-class palette citizens (Section 2)
        cube: {
          white: "#FFFFFF",
          yellow: "#FFD500",
          red: "#B90000",
          orange: "#FF5900",
          green: "#009B48",
          blue: "#0045AD",
        },
        // Chrome / metallic ramp (Section 4/5)
        chrome: {
          highlight: "#F5F6F8",
          light: "#D7DAE0",
          mid: "#A6ABB6",
          shadow: "#6B707C",
          deep: "#3A3D45",
        },

        // ---- SEMANTIC TOKENS (mode-aware, Section 2) ----
        bg: {
          default: semantic("bg-default"),
          subtle: semantic("bg-subtle"),
        },
        surface: {
          default: semantic("surface-default"),
          raised: semantic("surface-raised"),
          sunken: semantic("surface-sunken"),
        },
        text: {
          primary: semantic("text-primary"),
          secondary: semantic("text-secondary"),
          tertiary: semantic("text-tertiary"),
          "on-brand": semantic("text-on-brand"),
          inverse: semantic("text-inverse"),
        },
        border: {
          DEFAULT: semantic("border-default"),
          subtle: semantic("border-subtle"),
          strong: semantic("border-strong"),
        },
        brand: {
          DEFAULT: semantic("brand-default"),
          hover: semantic("brand-hover"),
          subtle: semantic("brand-subtle"),
        },
        // Status — same value both modes (Section 2)
        status: {
          success: "#1F9254",
          warning: "#E8A400",
          danger: "#D8332A",
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', "system-ui", "sans-serif"],
        body: ['"Inter"', "system-ui", "sans-serif"],
      },
      // --- Type scale (Section 3) ---
      fontSize: {
        "display-lg": ["48px", { lineHeight: "56px", fontWeight: "700" }],
        "display-sm": ["36px", { lineHeight: "44px", fontWeight: "700" }],
        "heading-lg": ["28px", { lineHeight: "36px", fontWeight: "700" }],
        "heading-md": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "heading-sm": ["20px", { lineHeight: "28px", fontWeight: "500" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-lg": ["16px", { lineHeight: "20px", fontWeight: "600" }],
        "label-md": ["14px", { lineHeight: "18px", fontWeight: "600" }],
        caption: ["12px", { lineHeight: "16px", fontWeight: "500", letterSpacing: "0.1px" }],
      },
      backgroundImage: {
        // Chrome/metallic diagonal sweep (Section 5) — deliberate, sparing use only.
        "chrome-gradient":
          "linear-gradient(135deg, #F5F6F8 0%, #D7DAE0 28%, #A6ABB6 52%, #6B707C 78%, #3A3D45 100%)",
      },
    },
  },
  plugins: [],
};
