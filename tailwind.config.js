/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080c14", // Deep dark navy foundation
        surface: "#0f172a",    // Dark slate panel surface
        panel: "#131d31",      // Elevated card panel
        subtle: "#1e293b",     // Muted borders and dividing lines
        border: "#25334d",     // Crisp structural border
        foreground: "#f1f5f9", // Crisp high contrast text
        muted: "#94a3b8",      // Secondary metadata text
        
        accent: {
          DEFAULT: "#06b6d4",  // Crisp technical cyan
          foreground: "#080c14",
          subtle: "rgba(6, 182, 212, 0.12)",
        },
        hold: {
          DEFAULT: "#ef4444",  // Urgent red for HOLD / Critical
          subtle: "rgba(239, 68, 68, 0.15)",
          border: "#b91c1c",
        },
        warn: {
          DEFAULT: "#f59e0b",  // Amber for Verification Required / Warning
          subtle: "rgba(245, 158, 11, 0.15)",
          border: "#d97706",
        },
        approved: {
          DEFAULT: "#10b981",  // Emerald for Restored / Verified / Approved
          subtle: "rgba(16, 185, 129, 0.15)",
          border: "#059669",
        },
        info: {
          DEFAULT: "#38bdf8",  // Light Sky for Telemetry / Active State
          subtle: "rgba(56, 189, 248, 0.15)",
        }
      },
      fontFamily: {
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      }
    },
  },
  plugins: [],
};
