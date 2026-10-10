/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    { pattern: /bg-(emerald|amber|rose|teal|cyan|purple|blue|slate|orange)-(50|100|200|500|600|700|800|900|950)(\/(15|20|30|40|50|60|80))?/ },
    { pattern: /text-(emerald|amber|rose|teal|cyan|purple|blue|slate|orange)-(600|700|800|900)/ },
    { pattern: /border-(emerald|amber|rose|teal|cyan|purple|blue|slate|orange)-(200|300|400|500|600|700|800)/ },
  ],
  theme: {
    extend: {
      colors: {
        background: "#f8fafc",
        foreground: "#0f172a",
        utility: {
          DEFAULT: "#0284c7",
          hover: "#0369a1",
          subtle: "#e0f2fe",
          border: "#bae6fd",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
