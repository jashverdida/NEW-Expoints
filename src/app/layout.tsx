import type { Metadata, Viewport } from "next";
import { Poppins, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";

/* Sora carries the headings — geometric and confident without tipping into
   novelty "gamer" lettering. Poppins stays for body copy so the rebuild still
   reads as EXPoints. JetBrains Mono handles every number in the HUD. */
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "600", "700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-stat",
  display: "swap",
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "EXPoints — Game Reviews Worth Levelling Up For",
    template: "%s · EXPoints",
  },
  description:
    "The gamified game review forum. Post reviews, earn EXP, climb the ranks and get your takes on the front page. Built for gamers who are tired of bland forums.",
  keywords: [
    "game reviews",
    "gaming forum",
    "video game community",
    "game ratings",
    "EXPoints",
  ],
  openGraph: {
    title: "EXPoints — Game Reviews Worth Levelling Up For",
    description:
      "Post reviews, earn EXP, climb the ranks. The gaming forum with an actual progression system.",
    siteName: "EXPoints",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  icons: { icon: "/favicon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#03060f",
  width: "device-width",
  initialScale: 1,
  // Zoom stays enabled — pinch-to-zoom is an accessibility requirement.
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${poppins.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
