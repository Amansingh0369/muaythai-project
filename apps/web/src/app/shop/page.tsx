import type { Metadata } from "next";
import { SITE_CONFIG } from "@repo/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import ShopComingSoon from "@/components/ShopComingSoon";
import training from "@/assets/training.jpg";

export const metadata: Metadata = {
  title: `Shop | ${SITE_CONFIG.brand}`,
  description: "Official This Is Muay Thai merchandise is coming soon. Stay tuned for authentic gear, apparel, and fight camp essentials.",
};

const ShopPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="The Shop"
        label="Merch & Gear"
        subtitle="Authentic Muay Thai apparel, gear, and fight camp essentials — engineered for those who train the real thing."
        image={training.src}
      />
      <ShopComingSoon />
      <Footer />
    </main>
  );
};

export default ShopPage;
