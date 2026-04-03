import { motion } from "framer-motion";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { SITE_CONFIG } from "@repo/utils";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 glass-surface"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <a href="#" className="flex items-center gap-3">
          <img src={logo.src} alt={SITE_CONFIG.brand} className="h-10 w-10 rounded-full" />
          <span className="font-display text-xl tracking-wider text-foreground">
            {SITE_CONFIG.brand}
          </span>
        </a>
 
        {/* Desktop */}
        <div className="hidden md:flex items-center gap-8">
          {SITE_CONFIG.navigation.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="font-heading text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors duration-300"
            >
              {item.label}
            </a>
          ))}
          <a
            href="#camps"
            className="bg-gradient-fire px-6 py-2.5 font-heading text-sm tracking-widest uppercase text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
          >
            Book Camp
          </a>
        </div>
 
        {/* Mobile toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
 
      {/* Mobile menu */}
      {isOpen && (
        <motion.div
          className="md:hidden glass-surface border-t border-border"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-6 py-6 flex flex-col gap-4">
            {SITE_CONFIG.navigation.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="font-heading text-sm tracking-widest uppercase text-muted-foreground hover:text-primary transition-colors"
              >
                {item.label}
              </a>
            ))}
            <a
              href="#camps"
              onClick={() => setIsOpen(false)}
              className="bg-gradient-fire px-6 py-2.5 font-heading text-sm tracking-widest uppercase text-primary-foreground rounded-sm text-center"
            >
              Book Camp
            </a>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
