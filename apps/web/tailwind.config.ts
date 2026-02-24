import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        im: {
          bg: "#ffffff",
          subtle: "#f6f7f8",
          border: "#f0f2f4",
          primary: "#FF6000",
          "primary-hover": "#E05500",
          "primary-soft": "#FFF2E8",
          "text-main": "#111418",
          "text-muted": "#637488",
          danger: "#ef4444",
          success: "#10b981"
        }
      },
      fontFamily: {
        display: [
          "Pretendard Variable",
          "Pretendard",
          "Inter",
          "Noto Sans KR",
          "Apple SD Gothic Neo",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(255, 96, 0, 0.4)",
        card: "0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)",
        soft: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)"
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateY(0)", opacity: "0.45" },
          "50%": { transform: "translateY(-4px)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0.45" }
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.8)", opacity: "0.5" },
          "80%, 100%": { transform: "scale(2)", opacity: "0" }
        }
      },
      animation: {
        wave: "wave 1.1s ease-in-out infinite",
        "pulse-ring": "pulse-ring 1.25s cubic-bezier(0.215, 0.61, 0.355, 1) infinite"
      }
    }
  },
  plugins: []
};

export default config;
