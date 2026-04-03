/**
 * @repo/utils Site Configuration
 * Centralized content for the Muay Thai platform.
 */

export const SITE_CONFIG = {
  brand: "THIS IS MUAY THAI",
  taglines: {
    heroSub: "Most people train. Few experience.",
    heroMain: ["TRAVEL.", "TRAIN.", "TRANSFORM."],
    heroDesc: "Authentic Muay Thai fight camps in Thailand. No shortcuts. No watered-down versions. Just the real thing.",
    footer: "Travel. Train. Transform.",
  },

  navigation: [
    { label: "About", href: "#about" },
    { label: "Fight Camps", href: "#camps" },
    { label: "Locations", href: "#locations" },
    { label: "About Muay Thai", href: "#muaythai" },
  ],

  socials: [
    { label: "Instagram", href: "#" },
    { label: "YouTube", href: "#" },
    { label: "WhatsApp", href: "#" },
    { label: "Email", href: "#" },
  ],

  highlights: [
    { text: "Authentic Muay Thai training system" },
    { text: "Fight camps in Thailand — train where it all began" },
    { text: "Bootcamps in India with experienced Thai trainers" },
    { text: "Beginner-friendly — no prior experience needed" },
    { text: "Structured training for all levels" },
    { text: "Real techniques, conditioning, and discipline" },
    { text: "Small group training for better progress" },
    { text: "More than fitness — skill, experience, and transformation" },
  ],

  benefits: [
    { title: "Full-Body Conditioning", desc: "Strength, endurance, and agility in every session" },
    { title: "Effective Fat Loss", desc: "High-intensity training that burns calories fast" },
    { title: "Real Self-Defense", desc: "Practical techniques that actually work" },
    { title: "Mental Discipline", desc: "Focus, control, and resilience under pressure" },
    { title: "Confidence Building", desc: "Push beyond comfort and build self-belief" },
    { title: "Heart, Stress Relief", desc: "Channel energy into powerful, structured movement" },
    { title: "Coordination & Balance", desc: "Better control over your entire body" },
    { title: "Fighter-Level Fitness", desc: "Train like athletes, not just gym-goers" },
  ],

  camps: [
    {
      id: "beginner",
      title: "Beginner Experience",
      subtitle: "Your First Fight Camp",
      duration: "7 Days",
      idealFor: "First-timers / Fitness Enthusiasts",
      includes: [
        "2 training sessions per day",
        "Basic Muay Thai techniques",
        "Pad work & conditioning",
        "Beginner-friendly coaching",
        "Full gym access",
      ],
      outcome: "Learn fundamentals + experience real training",
      accent: "from-primary to-orange-deep",
    },
    {
      id: "intermediate",
      title: "Intermediate Training",
      subtitle: "Level Up Your Game",
      duration: "14 Days",
      idealFor: "Regular Trainees / Returning Participants",
      includes: [
        "Advanced techniques & combinations",
        "Sparring sessions",
        "Clinch training",
        "Conditioning & endurance work",
        "Trainer feedback & correction",
      ],
      outcome: "Improved technique + fight understanding",
      accent: "from-blue-electric to-blue-deep",
      featured: true,
    },
    {
      id: "fighter",
      title: "Fighter Camp",
      subtitle: "Intensive. Relentless.",
      duration: "3–4 Weeks",
      idealFor: "Serious Trainees / Fighters",
      includes: [
        "High-intensity training (2 daily sessions)",
        "Sparring + clinch-heavy sessions",
        "Fight conditioning programs",
        "Optional fight preparation",
        "Personalized guidance",
      ],
      outcome: "Peak conditioning + real fight readiness",
      accent: "from-primary to-orange-glow",
    },
  ],

  locations: [
    {
      name: "Phuket",
      vibe: "Fighter Island · Chill Vibes",
      description: "The perfect balance of serious training and lifestyle experience. International camps, high-quality gyms, and the beach after every session.",
      bestFor: "First-time trainees · Fitness-focused · Training + travel balance",
      schedule: "7:00 AM – 9:30 AM · 4:00 PM – 6:30 PM",
    },
    {
      name: "Bangkok",
      vibe: "Hardcore · Old School · Legendary",
      description: "The heart of professional Muay Thai. Elite fighters, iconic stadiums, and training that pushes you harder than you thought possible.",
      bestFor: "Intermediate to advanced · Fighters · Intense environment",
      schedule: "6:30 AM – 9:00 AM · 3:30 PM – 6:30 PM",
    },
    {
      name: "Chiang Mai",
      vibe: "Laid Back · Traditional · Immersive",
      description: "Traditional and focused training in a quieter setting. Smaller groups, disciplined culture, and full immersion in the art.",
      bestFor: "Technique-focused · Long-term learners · Quiet immersion",
      schedule: "7:00 AM – 9:00 AM · 4:00 PM – 6:00 PM",
    },
    {
      name: "Krabi",
      vibe: "Scenic · Raw · Hidden Gem",
      description: "Limestone cliffs, emerald waters, and a famous gym with outdoor training that feels like another world entirely.",
      bestFor: "Beginners & intermediate · Training + scenic experience",
      schedule: "7:00 AM – 9:00 AM · 4:00 PM – 6:00 PM",
    },
    {
      name: "Koh Samui",
      vibe: "Exclusive · Premium · Great Fight Scene",
      description: "Premium camps with strong international community. High-quality facilities, experienced trainers, and a lifestyle-oriented experience.",
      bestFor: "International trainees · Premium experience · Fitness + lifestyle",
      schedule: "7:30 AM – 10:00 AM · 4:00 PM – 6:30 PM",
    },
  ],

  batches: [
    { location: "PHUKET BATCH", date: "10th – 17th June", status: "Limited Slots" },
    { location: "BANGKOK BATCH", date: "25th June – 2nd July", status: "Limited Slots" },
  ],

  copyright: `© ${new Date().getFullYear()} This Is Muay Thai. All rights reserved.`,
};
