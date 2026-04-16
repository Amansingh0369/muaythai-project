import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";
import MuayThaiSection from "@/components/MuayThaiSection";
import HighlightsSection from "@/components/HighlightsSection";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "About Our Heritage & Muay Thai | This Is Muay Thai",
  description: "Discover the philosophy and heritage behind This Is Muay Thai and learn about the rich history and techniques of the Art of Eight Limbs.",
};

const AboutPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero 
        title="Our Heritage"
        label="About This Is Muay Thai"
        subtitle="Born in the heart of Thailand, built for the global warrior. We bring authentic training to those who seek more than just fitness."
        image="https://images.unsplash.com/photo-1599058917233-57c0e620c29b?q=80&w=2070&auto=format&fit=crop"
      />
      <AboutSection />
      <MuayThaiSection />
      <HighlightsSection />
      <Footer />
    </main>
  );
};

export default AboutPage;
