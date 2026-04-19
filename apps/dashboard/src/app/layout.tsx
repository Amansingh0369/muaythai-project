import type { Metadata, Viewport } from "next";
import { Inter, Oswald, Barlow_Condensed } from "next/font/google";
import React, { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { API_CONFIG } from "@/lib/api-constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" });
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-barlow",
});

export const metadata: Metadata = {
  title: "Muay Thai | Admin Dashboard",
  description: "Elite administrative portal for Muay Thai operations.",
};

export const viewport: Viewport = {
  themeColor: "#EF4444",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${oswald.variable} ${barlow.variable} font-sans bg-black text-white antialiased`}
      >
        <GoogleOAuthProvider clientId={API_CONFIG.GOOGLE_CLIENT_ID}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
