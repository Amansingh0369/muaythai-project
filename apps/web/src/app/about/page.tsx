import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AboutSection from "@/components/AboutSection";
import MuayThaiSection from "@/components/MuayThaiSection";
import HighlightsSection from "@/components/HighlightsSection";
import PageHero from "@/components/PageHero";
import about from "@/assets/about.jpg";

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
        image={about.src}
      />
      <AboutSection />
      <MuayThaiSection />
      <HighlightsSection />
      <Footer />
    </main>
  );
};

export default AboutPage;
