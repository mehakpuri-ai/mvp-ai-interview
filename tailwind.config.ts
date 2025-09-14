// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        accent: "#9764c9",
        altAccent: "#ffed80"
      }
    }
  },
  plugins: []
};

export default config;
