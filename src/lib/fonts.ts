import { Plus_Jakarta_Sans, Sora } from "next/font/google";

// Brand wordmark ("DANCE CLUB / VIT CHENNAI") and the splash screen.
export const brandFont = Sora({ subsets: ["latin"], weight: ["300", "400", "600"] });

// Working Committee typeface: a bold geometric sans. Dance Floor uses Sora instead.
export const consoleFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});
