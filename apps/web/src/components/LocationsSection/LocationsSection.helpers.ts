import phuketImg from "@/assets/phuket.jpg";
import bangkokImg from "@/assets/bangkok.jpg";
import chiangmaiImg from "@/assets/chiangmai.jpg";
import krabiImg from "@/assets/krabi.jpg";
import kohsamuiImg from "@/assets/kohsamui.jpg";
import { SITE_CONFIG } from "@repo/utils";

/** Maps location names to their local image assets */
export const locationImages = {
  Phuket: phuketImg,
  Bangkok: bangkokImg,
  "Chiang Mai": chiangmaiImg,
  Krabi: krabiImg,
  "Koh Samui": kohsamuiImg,
};

/** Location data enriched with image assets */
export const locations = SITE_CONFIG.locations.map((loc) => ({
  ...loc,
  image: locationImages[loc.name as keyof typeof locationImages],
}));
