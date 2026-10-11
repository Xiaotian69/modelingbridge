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
      colors: {
        bridge: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          400: "#5ab8a7",
          600: "#148a7b",
          700: "#157a6e",
          800: "#185f55",
          900: "#134e4a",
        },
      },
    },
  },
  plugins: [],
};
