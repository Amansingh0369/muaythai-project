import type { Metadata } from "next";
import { SITE_CONFIG } from "@repo/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FightCampsSection from "@/components/FightCampsSection";
import PageHero from "@/components/PageHero";
import heroImg from "@/assets/hero-fighter.jpg";

export const metadata: Metadata = {
  title: `Fight Camps | ${SITE_CONFIG.brand}`,
  description:
    "Browse our group Muay Thai fight camps across Thailand — filter by month, duration, and city.",
};

const CampsPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="Fight Camps"
        label="Camps"
        subtitle="Group Muay Thai camps across Thailand — browse by month, duration, and city."
        image={heroImg.src}
      />

      {/* Group camps, filterable by month / duration / city */}
      <FightCampsSection />

      <Footer />
    </main>
  );
};

export default CampsPage;
