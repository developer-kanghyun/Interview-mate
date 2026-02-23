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
      boxShadow: {
        soft: "0 12px 30px -18px rgba(15, 23, 42, 0.22)",
        glass: "0 20px 40px -24px rgba(15, 23, 42, 0.28)"
      },
      keyframes: {
        wave: {
          "0%": { transform: "translateY(0)", opacity: "0.45" },
          "50%": { transform: "translateY(-4px)", opacity: "1" },
          "100%": { transform: "translateY(0)", opacity: "0.45" }
        }
      },
      animation: {
        wave: "wave 1.1s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
