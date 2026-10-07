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
      // Shared page background for the whole app (both sections): neutral near-black, as bg-base.
      // Background ONLY: as a general colour, "base" also made text-base (the normal text SIZE)
      // paint text #0a0a0c, which hid the dashboard subheading.
      backgroundColor: {
        base: "#0a0a0c",
        // Raised panel / card surface in the Working Committee (was typed as #111014 by hand).
        surface: "#111014",
      },
      // Motion system: one easing curve and three speeds for the whole app.
      //   duration-120  tiny feedback (press, hover)   duration-200  cards, dropdowns, toasts
      //   duration-320  page / section reveal          ease-brand    every one of them
      transitionTimingFunction: { brand: "cubic-bezier(0.2, 0.8, 0.2, 1)" },
      transitionDuration: { 120: "120ms", 320: "320ms" },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
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
