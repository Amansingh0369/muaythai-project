import { Flame, Swords, Crown } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

import { Package } from "@/services/package.service";

/** Maps camp IDs to their corresponding Lucide icons */
export const iconMap = {
  beginner: Flame,
  intermediate: Swords,
  fighter: Crown,
};

export interface EnrichedPackage extends Package {
  title: string;
  subtitle: string;
  duration: string;
  idealFor: string;
  includes: string[];
  outcome: string;
  accent: string;
  icon: any;
  featured?: boolean;
}

/**
 * Enriches API package data with static visual assets and descriptions
 */
export function enrichPackages(apiPackages: Package[]): EnrichedPackage[] {
  return apiPackages.map((apiPkg) => {
    // Attempt to find a match in SITE_CONFIG by name (case-insensitive)
    const staticData = SITE_CONFIG.camps.find(
      (camp) => camp.title.toLowerCase() === apiPkg.name.toLowerCase()
    );

    // Default to 'beginner' assets if no match is found for a new camp type
    const baseTemplate = staticData || SITE_CONFIG.camps[0];

    return {
      ...apiPkg,
      title: apiPkg.name,
      subtitle: baseTemplate.subtitle,
      duration: `${apiPkg.duration_days} Days`,
      idealFor: baseTemplate.idealFor,
      includes: baseTemplate.includes,
      outcome: baseTemplate.outcome,
      accent: baseTemplate.accent,
      featured: baseTemplate.featured,
      icon: iconMap[baseTemplate.id as keyof typeof iconMap] || iconMap.beginner,
    };
  });
}
