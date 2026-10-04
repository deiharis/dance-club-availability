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
        // Shared page background for the whole app (both sections): neutral near-black.
        base: "#0a0a0c",
        // Neutral greys for the console; existing gray-* classes follow.
        gray: colors.zinc,
        // The Working Committee accent is violet. Existing purple-* classes on
        // committee/member pages render as this violet.
        purple: colors.violet,
      },
    },
  },
  plugins: [],
};
export default config;
