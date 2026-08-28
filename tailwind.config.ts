import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2f1ff",
          100: "#e6e4ff",
          200: "#c9c3ff",
          300: "#a99eff",
          400: "#8b7bff",
          500: "#6d55ff",
          600: "#5a3ff0",
          700: "#4830c4",
          800: "#38259c",
          900: "#2a1c75",
        },
      },
    },
  },
  plugins: [],
};

export default config;
