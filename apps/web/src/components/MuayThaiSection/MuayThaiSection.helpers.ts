import { Shield, Zap, Heart, Brain, Target, Flame, Move, Trophy } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

/** Ordered icon list mapped positionally to benefits from SITE_CONFIG */
export const iconMap = [Zap, Flame, Shield, Brain, Target, Heart, Move, Trophy];

/** Benefits data enriched with icon components */
export const benefits = SITE_CONFIG.benefits.map((benefit, index) => ({
  ...benefit,
  icon: iconMap[index],
}));
