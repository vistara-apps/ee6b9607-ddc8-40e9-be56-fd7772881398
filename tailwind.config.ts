import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Design system color tokens from spec
        bg: "hsl(220 10% 15%)", // Background
        primary: "hsl(210 100% 50%)", // Primary
        accent: "hsl(160 100% 40%)", // Accent
        surface: "hsl(220 10% 20%)", // Surface
        "text-primary": "hsl(0 0% 95%)", // Text Primary
        "text-secondary": "hsl(0 0% 70%)", // Text Secondary
        border: "hsl(0 0% 50%)", // Border color
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
};
export default config;
