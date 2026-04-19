import phuketImg from "@/assets/phuket.jpg";
import bangkokImg from "@/assets/bangkok.jpg";
import chiangmaiImg from "@/assets/chiangmai.jpg";
import krabiImg from "@/assets/krabi.jpg";
import kohsamuiImg from "@/assets/kohsamui.jpg";
import { SITE_CONFIG } from "@repo/utils";

import { Location } from "@/services/location.service";

/** Maps location names to their local image assets */
export const locationImages = {
  Phuket: phuketImg,
  Bangkok: bangkokImg,
  "Chiang Mai": chiangmaiImg,
  Krabi: krabiImg,
  "Koh Samui": kohsamuiImg,
};

export interface EnrichedLocation extends Location {
  image: any;
  vibe: string;
  description: string;
  themeColor: string;
}

/** 
 * Enriches API location data with static visual assets and themes
 */
export function enrichLocations(apiLocations: Location[]): EnrichedLocation[] {
  return apiLocations.map((apiLoc) => {
    // Attempt to find a match in SITE_CONFIG by name
    const staticData = SITE_CONFIG.locations.find(
      (loc) => loc.name.toLowerCase() === apiLoc.name.toLowerCase()
    );

    // Default values if no match is found (for new cities added via dashboard)
    return {
      ...apiLoc,
      image: locationImages[apiLoc.name as keyof typeof locationImages] || locationImages.Bangkok,
      vibe: staticData?.vibe || "Fighter Community · Intense Training",
      description: staticData?.description || "Authentic Muay Thai experience in a locally recognized training hub.",
      themeColor: staticData?.themeColor || "#f59e0b", // Default orange
    };
  });
}
