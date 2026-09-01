import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Bebas_Neue, Barlow_Condensed, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE_CONFIG } from "@repo/utils";
import StickyReveal from "@/components/StickyReveal";
import FighterCardReminder from "@/components/FighterCardReminder";
import { TrackingNoScript, TrackingScripts } from "@/components/Tracking";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas-neue" });
const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
});
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: SITE_CONFIG.brand + " | Forge Your Legacy",
  description: SITE_CONFIG.taglines.heroDesc,
  appleWebApp: {
    capable: true,
    title: "This Is Muay Thai",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${oswald.variable} ${bebasNeue.variable} ${barlowCondensed.variable} ${spaceGrotesk.variable} font-body antialiased selection:bg-primary selection:text-black`}>
        <TrackingNoScript />
        <TrackingScripts />
        <Providers>
          <StickyReveal>
            {children}
          </StickyReveal>
          {/* Site-wide, so a friend who was booked onto a camp sees it wherever
              they land after setting their password — not only on one tab. */}
          <FighterCardReminder />
        </Providers>
        {/* Vercel Web Analytics — page views and visitors. Only reports from
            the deployed site; it is inert on localhost. */}
        <Analytics />
      </body>
    </html>
  );
}
