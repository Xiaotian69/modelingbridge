/**
 * Colours used by the older Tailwind pages resolve to CSS variables
 * (src/design/tailwindBridge.css), so those pages follow the V2 light / dark theme
 * without rewriting every class name.
 */
const shades = {
  white: [],
  slate: [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950],
  bridge: [50, 100, 200, 400, 600, 700, 800, 900],
  emerald: [50, 100, 200, 300, 800, 900, 950],
  amber: [50, 100, 200, 400, 700, 800, 900, 950],
  rose: [50, 100, 200, 700, 900],
  red: [300, 600, 700],
  cyan: [50, 200, 800],
};
const variable = (name) => `rgb(var(--tw-${name}) / <alpha-value>)`;
const colors = Object.fromEntries(
  Object.entries(shades).map(([family, steps]) => [
    family,
    steps.length
      ? Object.fromEntries(steps.map((step) => [step, variable(`${family}-${step}`)]))
      : variable(family),
  ]),
);

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "Segoe UI",
          "PingFang SC",
          "Microsoft YaHei",
          "Noto Sans SC",
          "sans-serif",
        ],
      },
      colors,
    },
  },
  plugins: [],
};
