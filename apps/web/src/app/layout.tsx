import type { Metadata } from "next";
import { Inter, Oswald, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { SITE_CONFIG } from "@repo/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const bebasNeue = Bebas_Neue({ weight: "400", subsets: ["latin"], variable: "--font-bebas-neue" });

export const metadata: Metadata = {
  title: SITE_CONFIG.brand + " | Forge Your Legacy",
  description: SITE_CONFIG.taglines.heroDesc,
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${oswald.variable} ${bebasNeue.variable} font-body antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
