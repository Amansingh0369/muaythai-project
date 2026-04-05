import React from "react";
import { Mail, MapPin, Instagram, Youtube, Twitter } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

/** Footer navigation link groups */
export const footerLinks = [
  {
    title: "Experience",
    links: SITE_CONFIG.navigation.map((nav) => ({ label: nav.label, href: nav.href })),
  },
  {
    title: "Company",
    links: [
      { label: "About Founders", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Contact", href: "#", pulse: true },
    ],
  },
];

/** Footer contact info entries */
export const contactInfo = [
  {
    icon: React.createElement(Mail, { size: 18, className: "text-primary" }),
    text: "train@thisismuaythai.com",
    href: "mailto:train@thisismuaythai.com",
  },
  {
    icon: React.createElement(MapPin, { size: 18, className: "text-primary" }),
    text: "Bangkok, Thailand",
  },
];

/** Maps social platform labels to their Lucide icon elements */
export const socialIcons: Record<string, React.ReactNode> = {
  Instagram: React.createElement(Instagram, { size: 20 }),
  YouTube: React.createElement(Youtube, { size: 20 }),
  Twitter: React.createElement(Twitter, { size: 20 }),
};
