import {
  Umbrella,
  Waves,
  Martini,
  Sailboat,
  Sun,
  Building2,
  Landmark,
  Utensils,
  Music,
  Trophy,
  Mountain,
  TreePine,
  Coffee,
  Flower2,
  Anchor,
  Camera,
  Fish,
  Wine,
  Ship,
  Dumbbell,
  type LucideIcon,
} from "lucide-react";

export interface MapDecoration {
  icon: LucideIcon;
  coords: [number, number];
}

/**
 * Decorative ambient POIs scattered across Thailand — fake, hardcoded, purely
 * for map flavour. Non-interactive; they never represent real camps.
 */
export const MAP_DECORATIONS: MapDecoration[] = [
  // Phuket — beach / chill
  { icon: Umbrella, coords: [7.82, 98.3] },
  { icon: Waves, coords: [7.9, 98.28] },
  { icon: Martini, coords: [7.89, 98.42] },
  { icon: Sailboat, coords: [7.79, 98.34] },
  { icon: Sun, coords: [7.95, 98.4] },
  // Bangkok — city / hardcore
  { icon: Building2, coords: [13.73, 100.54] },
  { icon: Landmark, coords: [13.75, 100.49] },
  { icon: Utensils, coords: [13.78, 100.51] },
  { icon: Music, coords: [13.72, 100.57] },
  { icon: Trophy, coords: [13.77, 100.5] },
  // Chiang Mai — mountains / traditional
  { icon: Mountain, coords: [18.82, 98.9] },
  { icon: TreePine, coords: [18.74, 98.95] },
  { icon: Coffee, coords: [18.8, 99.01] },
  { icon: Flower2, coords: [18.77, 99.03] },
  { icon: Landmark, coords: [18.79, 98.99] },
  // Krabi — cliffs / scenic
  { icon: Mountain, coords: [8.01, 98.84] },
  { icon: Anchor, coords: [8.07, 98.92] },
  { icon: Waves, coords: [8.03, 98.83] },
  { icon: Camera, coords: [8.15, 98.79] },
  { icon: Fish, coords: [8.05, 98.96] },
  // Koh Samui — premium / fight scene
  { icon: Flower2, coords: [9.53, 100.06] },
  { icon: Wine, coords: [9.55, 100.08] },
  { icon: Waves, coords: [9.47, 100.02] },
  { icon: Ship, coords: [9.56, 100.05] },
  { icon: Dumbbell, coords: [9.5, 100.04] },

  // ── Rest of Thailand — ambient country-wide flavour ──
  // North
  { icon: Landmark, coords: [19.91, 99.84] }, // Chiang Rai
  { icon: Coffee, coords: [19.87, 99.82] },
  { icon: Mountain, coords: [19.36, 98.44] }, // Pai
  { icon: TreePine, coords: [19.3, 97.97] }, // Mae Hong Son
  { icon: Camera, coords: [18.78, 100.77] }, // Nan
  { icon: Landmark, coords: [17.01, 99.7] }, // Sukhothai
  { icon: Coffee, coords: [18.29, 99.49] }, // Lampang
  // Isaan (north-east)
  { icon: Utensils, coords: [17.41, 102.79] }, // Udon Thani
  { icon: Waves, coords: [17.88, 102.74] }, // Nong Khai (Mekong)
  { icon: Music, coords: [16.44, 102.83] }, // Khon Kaen
  { icon: Trophy, coords: [14.99, 103.1] }, // Buriram (stadium)
  { icon: Landmark, coords: [14.97, 102.1] }, // Nakhon Ratchasima
  { icon: Sun, coords: [15.24, 104.85] }, // Ubon Ratchathani
  // Central
  { icon: Landmark, coords: [14.35, 100.58] }, // Ayutthaya ruins
  { icon: Camera, coords: [14.36, 100.56] },
  { icon: TreePine, coords: [14.02, 99.53] }, // Kanchanaburi
  { icon: Landmark, coords: [14.8, 100.61] }, // Lopburi
  // East coast
  { icon: Music, coords: [12.93, 100.88] }, // Pattaya
  { icon: Martini, coords: [12.92, 100.86] },
  { icon: Umbrella, coords: [12.57, 99.96] }, // Hua Hin
  { icon: Wine, coords: [12.55, 99.95] },
  { icon: Waves, coords: [12.68, 101.28] }, // Rayong
  { icon: Sailboat, coords: [12.05, 102.32] }, // Koh Chang
  // Southern islands & gulf
  { icon: Utensils, coords: [9.14, 99.33] }, // Surat Thani
  { icon: Fish, coords: [10.1, 99.84] }, // Koh Tao
  { icon: Anchor, coords: [10.06, 99.82] },
  { icon: Music, coords: [9.75, 100.03] }, // Koh Phangan
  { icon: Martini, coords: [9.73, 100.01] },
  { icon: Sailboat, coords: [7.74, 98.77] }, // Phi Phi
  { icon: Waves, coords: [7.72, 98.79] },
  // Deep south
  { icon: Camera, coords: [7.56, 99.61] }, // Trang
  { icon: Landmark, coords: [8.43, 99.96] }, // Nakhon Si Thammarat
  { icon: Building2, coords: [7.01, 100.47] }, // Hat Yai
  { icon: Umbrella, coords: [7.2, 100.6] }, // Songkhla
];
