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
    "Choose from our intensive Muay Thai fight camp programs — from your first camp to fighter-level training in Thailand.",
};

const CampsPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="Fight Camps"
        label="Camps"
        subtitle="Structured Muay Thai programs for every level — from your first camp to fighter-level intensity."
        image={heroImg.src}
      />

      {/* Fight Camps Programs */}
      <FightCampsSection />

      <Footer />
    </main>
  );
};

export default CampsPage;
