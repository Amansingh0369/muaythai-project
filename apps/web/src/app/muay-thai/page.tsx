import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import MuayThaiSection from "@/components/MuayThaiSection";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "The Art of Eight Limbs | This Is Muay Thai",
  description: "Learn about the rich history, tradition, and techniques of Muay Thai. From ancient origins to modern professional striking.",
};

const MuayThaiPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="Muay Thai"
        label="The Art of Eight Limbs"
        subtitle="Heritage, tradition, and the science of the most effective striking art in the world. Understand the soul of the sport."
        image="https://images.unsplash.com/photo-1509564341975-3e289bf4437a?q=80&w=2070&auto=format&fit=crop"
      />
      <MuayThaiSection />
      <Footer />
    </main>
  );
};

export default MuayThaiPage;
