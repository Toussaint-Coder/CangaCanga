/** @type {import('tailwindcss').Config} */

// Semantic color tokens are backed by CSS variables (see global.css) so they can
// switch between light and dark themes automatically.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`;

module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // CangaCanga palette — no gradients anywhere.
        primary: withVar("--color-primary"),
        secondary: withVar("--color-secondary"),
        accent: withVar("--color-accent"),
        background: withVar("--color-background"),
        card: withVar("--color-card"),
        border: withVar("--color-border"),
        muted: withVar("--color-muted"),
        mutedLight: withVar("--color-mutedLight"),
        success: withVar("--color-success"),
        danger: withVar("--color-danger"),
        warning: withVar("--color-warning"),
        star: withVar("--color-star"),
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      fontFamily: {
        sans: ["Lufga-Regular"],
        light: ["Lufga-Light"],
        medium: ["Lufga-Medium"],
        semibold: ["Lufga-SemiBold"],
        bold: ["Lufga-Bold"],
        extrabold: ["Lufga-ExtraBold"],
      },
    },
  },
  plugins: [],
};
