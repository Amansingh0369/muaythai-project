import React from "react";
import { SITE_CONFIG } from "@repo/utils";
import { footerLinks, contactInfo, socialIcons } from "./Footer.helpers";

const Footer = () => {
  return (
    <footer className="relative w-full overflow-hidden bg-primary z-0">
      {/* Front Solid Content Card */}
      <div className="bg-black relative z-20 border-b border-border overflow-hidden">
        <div className="max-w-7xl mx-auto p-8 md:p-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 md:gap-8 lg:gap-16 pb-12">
            {/* Brand section */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center space-x-3">
                <span className="text-foreground font-display tracking-wider text-2xl font-bold">
                  {SITE_CONFIG.brand}
                </span>
              </div>
              <p className="text-sm font-body text-muted-foreground leading-relaxed">
                {SITE_CONFIG.taglines.heroDesc}
              </p>
            </div>

            {/* Footer link sections */}
            {footerLinks.map((section) => (
              <div key={section.title}>
                <h4 className="text-foreground font-heading tracking-[0.2em] text-sm uppercase font-semibold mb-6">
                  {section.title}
                </h4>
                <ul className="space-y-3 font-body">
                  {section.links.map((link) => (
                    <li key={link.label} className="relative w-fit">
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-primary transition-colors duration-300"
                      >
                        {link.label}
                      </a>
                      {link.pulse && (
                        <span className="absolute top-0 -right-4 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact section */}
            <div>
              <h4 className="text-foreground font-heading tracking-[0.2em] text-sm uppercase font-semibold mb-6">
                Contact Us
              </h4>
              <ul className="space-y-4 font-body">
                {contactInfo.map((item, i) => (
                  <li key={i} className="flex items-center space-x-3 text-muted-foreground">
                    {item.icon}
                    {item.href ? (
                      <a href={item.href} className="hover:text-primary transition-colors duration-300">
                        {item.text}
                      </a>
                    ) : (
                      <span className="hover:text-primary transition-colors duration-300">{item.text}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <hr className="border-t border-border/50 my-8" />

          {/* Footer bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center text-sm space-y-4 md:space-y-0 font-body">
            {/* Social icons */}
            <div className="flex space-x-6 text-muted-foreground">
              {SITE_CONFIG.socials.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="hover:text-primary transition-all duration-300 hover:scale-110"
                >
                  {socialIcons[social.label] || (
                    <span className="font-heading uppercase tracking-widest text-xs">{social.label}</span>
                  )}
                </a>
              ))}
            </div>

            {/* Copyright */}
            <p className="text-center md:text-left text-muted-foreground font-heading tracking-widest text-xs uppercase">
              {SITE_CONFIG.copyright}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
