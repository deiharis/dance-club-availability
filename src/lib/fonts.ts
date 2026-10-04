import { IBM_Plex_Sans } from "next/font/google";

// Working Committee typeface (a plain, "enterprise" sans). Dance Floor uses Sora instead.
export const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
