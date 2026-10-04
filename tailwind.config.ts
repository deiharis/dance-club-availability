import type { Config } from "tailwindcss";
import colors from "tailwindcss/colors";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Shared page background for the whole app (both sections).
        base: "#0d0705",
        // Warm neutrals instead of Tailwind's blue-tinted gray, so every
        // existing gray-* class sits properly on the warm base.
        gray: colors.stone,
        // The Working Committee accent is steel blue. Existing purple-* classes
        // on committee/member pages now render as this blue.
        purple: colors.sky,
      },
    },
  },
  plugins: [],
};
export default config;
