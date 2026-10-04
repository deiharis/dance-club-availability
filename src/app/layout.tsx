import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });

// opengraph-image.png and apple-icon.png in this folder are picked up automatically.
// metadataBase makes their URLs absolute (NEXTAUTH_URL is the site address in Vercel).
const siteUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
const description = "Members, timetables, rehearsals and performances for Dance Club VIT Chennai";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Dance Club VIT Chennai",
  description,
  openGraph: {
    title: "Dance Club VIT Chennai",
    description,
    siteName: "Dance Club VIT Chennai",
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "Dance Club VIT Chennai", description },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}