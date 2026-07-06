import React from "react";
import { Mail, Instagram, Youtube } from "lucide-react";
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
      { label: "About Founders", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Refund Policy", href: "/refund-policy" },
      { label: "Contact", href: "/contact" },
    ],
  },
];

/** Footer contact info entries */
export const contactInfo = [
  {
    icon: React.createElement(Mail, { size: 18, className: "text-primary" }),
    text: SITE_CONFIG.contact.email,
    href: `mailto:${SITE_CONFIG.contact.email}`,
  },
];

/** Maps social platform labels to their Lucide icon elements */
export const socialIcons: Record<string, React.ReactNode> = {
  Instagram: React.createElement(Instagram, { size: 20 }),
  YouTube: React.createElement(Youtube, { size: 20 }),
  Email: React.createElement(Mail, { size: 20 }),
};
