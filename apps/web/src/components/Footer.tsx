import logo from "@/assets/logo.png";
import { SITE_CONFIG } from "@repo/utils";

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="max-w-7xl mx-auto section-padding py-12 md:py-16">
        <div className="grid md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img src={logo.src} alt={SITE_CONFIG.brand} className="h-12 w-12 rounded-full" />
              <span className="font-display text-2xl text-foreground">{SITE_CONFIG.brand}</span>
            </div>
            <p className="font-body text-sm text-muted-foreground max-w-sm leading-relaxed">
              {SITE_CONFIG.taglines.heroDesc}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-heading text-xs tracking-[0.3em] uppercase text-foreground mb-4">Experience</h4>
            <ul className="space-y-2">
              {SITE_CONFIG.navigation.map((item) => (
                <li key={item.label}>
                  <a href={item.href} className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading text-xs tracking-[0.3em] uppercase text-foreground mb-4">Connect</h4>
            <ul className="space-y-2">
              {SITE_CONFIG.socials.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="font-body text-sm text-muted-foreground hover:text-primary transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-body text-xs text-muted-foreground">
            {SITE_CONFIG.copyright}
          </p>
          <p className="font-heading text-xs tracking-[0.3em] text-primary uppercase">
            {SITE_CONFIG.taglines.footer}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
