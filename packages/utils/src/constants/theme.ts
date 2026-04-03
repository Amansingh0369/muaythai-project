/**
 * @repo/utils Theme Configuration
 * Centralized design tokens for the Muay Thai platform.
 */

export const THEME = {
  colors: {
    background: "0 0% 4%",
    foreground: "0 0% 95%",
    primary: "24 95% 46%",
    primaryForeground: "0 0% 100%",
    secondary: "210 100% 50%",
    secondaryForeground: "0 0% 100%",
    muted: "0 0% 12%",
    mutedForeground: "0 0% 55%",
    accent: "24 100% 55%",
    accentForeground: "0 0% 100%",
    border: "0 0% 15%",
    ring: "24 95% 46%",
    
    // Custom Brand Tokens
    orange: {
      glow: "24 100% 50%",
      deep: "20 90% 38%",
      light: "30 100% 60%",
    },
    blue: {
      electric: "210 100% 50%",
      deep: "215 80% 35%",
    },
    surface: {
      elevated: "0 0% 8%",
      glass: "0 0% 100% / 0.05",
    }
  },
  
  gradients: {
    fire: "linear-gradient(135deg, hsl(24 100% 55%), hsl(20 90% 38%), hsl(30 100% 60%))",
    ice: "linear-gradient(135deg, hsl(210 100% 50%), hsl(215 80% 60%))",
    dark: "linear-gradient(180deg, hsl(0 0% 4%), hsl(0 0% 7%))",
  },
  
  fonts: {
    display: "Bebas Neue, sans-serif",
    heading: "Oswald, sans-serif",
    body: "Inter, sans-serif",
  },
  
  animation: {
    fadeSlow: 1.2,
    fadeMedium: 0.8,
    fadeFast: 0.4,
    entranceDelay: 0.5,
  }
};
