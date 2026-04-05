import { motion } from "motion/react";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon } from "lucide-react";
import logo from "@/assets/logo.png";
import { SITE_CONFIG } from "@repo/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useNavbarScroll } from "./Navbar.helpers";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { hidden } = useNavbarScroll();

  const handleBookClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?redirect=/#camps");
    }
  };

  return (
    <motion.nav
      className="fixed top-0 left-0 right-0 z-40 glass-surface"
      variants={{
        visible: { y: 0 },
        hidden: { y: "-100%" },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-3">
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

          {user ? (
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserIcon size={16} className="text-primary" />
                <span className="font-heading text-[10px] tracking-widest uppercase truncate max-w-[100px]">
                  {user.full_name.split(" ")[0]}
                </span>
              </div>
              <button
                onClick={() => logout()}
                className="text-muted-foreground hover:text-primary transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <a
              href="#camps"
              onClick={handleBookClick}
              className="bg-gradient-fire px-6 py-2.5 font-heading text-sm tracking-widest uppercase text-primary-foreground rounded-sm hover:opacity-90 transition-opacity"
            >
              Book Camp
            </a>
          )}
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

            {user ? (
              <div className="flex flex-col gap-4 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-foreground font-heading text-xs tracking-widest uppercase">
                  <UserIcon size={16} className="text-primary" />
                  {user.full_name}
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-heading text-xs tracking-widest uppercase"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            ) : (
              <a
                href="#camps"
                onClick={(e) => {
                  setIsOpen(false);
                  handleBookClick(e);
                }}
                className="bg-gradient-fire px-6 py-2.5 font-heading text-sm tracking-widest uppercase text-primary-foreground rounded-sm text-center"
              >
                Book Camp
              </a>
            )}
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

export default Navbar;
