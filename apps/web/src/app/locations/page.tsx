import type { Metadata } from "next";
import { SITE_CONFIG } from "@repo/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LocationsSection from "@/components/LocationsSection";
import BurnStrip from "@/components/BurnStrip";
import PageHero from "@/components/PageHero";
import heroImg from "@/assets/download.png";

export const metadata: Metadata = {
  title: `Locations | ${SITE_CONFIG.brand}`,
  description: "Explore our training hubs in Bangkok, Phuket, and beyond — Thailand's most iconic Muay Thai destinations.",
};

const LocationsPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="Training Hubs"
        label="Locations"
        subtitle="Intensive training across Thailand's most iconic destinations. From the heart of Bangkok to the beaches of Phuket."
        image={heroImg.src}
      />

      {/* Locations Explorer (Sticky Scroller) */}
      <div className="bg-black">
        <LocationsSection />
      </div>

      {/* Conversion Element */}
      <BurnStrip />

      <Footer />
    </main>
  );
};

export default LocationsPage;
