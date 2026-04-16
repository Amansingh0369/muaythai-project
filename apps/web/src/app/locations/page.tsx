import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsSection from "@/components/LocationsSection";
import FightCampsSection from "@/components/FightCampsSection";
import BurnStrip from "@/components/BurnStrip";
import PageHero from "@/components/PageHero";
import heroImg from "@/assets/download.png";

export const metadata: Metadata = {
  title: "Camps & Locations | This Is Muay Thai",
  description: "Explore our training hubs in Bangkok, Phuket, and beyond, and choose from our intensive fight camp programs.",
};

const ExperiencePage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="Training Hubs"
        label="Camps & Locations"
        subtitle="Intensive training across Thailand's most iconic destinations. From the heart of Bangkok to the beaches of Phuket."
        image={heroImg.src}
      />

      {/* Locations Explorer (Sticky Scroller) */}
      <div className="bg-black">
        <LocationsSection />
      </div>

      {/* Conversion Element */}
      <BurnStrip />

      {/* Fight Camps Programs */}
      <FightCampsSection />



      <Footer />
    </main>
  );
};

export default ExperiencePage;
