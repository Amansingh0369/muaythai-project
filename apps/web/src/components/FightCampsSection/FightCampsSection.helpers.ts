import { Flame, Swords, Crown } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

/** Maps camp IDs to their corresponding Lucide icons */
export const iconMap = {
  beginner: Flame,
  intermediate: Swords,
  fighter: Crown,
};

/** Camp data enriched with icon components */
export const camps = SITE_CONFIG.camps.map((camp) => ({
  ...camp,
  icon: iconMap[camp.id as keyof typeof iconMap],
}));
