import type { Metadata } from "next";
import { SITE_CONFIG } from "@repo/utils";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import ContactDetails from "@/components/ContactDetails";
import contact from "@/assets/training.jpg";

export const metadata: Metadata = {
  title: `Contact Us | ${SITE_CONFIG.brand}`,
  description: "Get in touch with This Is Muay Thai — reach us by email or phone, or follow the journey on Instagram and YouTube.",
};

const ContactPage = () => {
  return (
    <main className="bg-background min-h-screen">
      <Navbar />
      <PageHero
        title="Get In Touch"
        label="Contact This Is Muay Thai"
        subtitle="Questions about a camp, a booking, or your training journey? Reach out — we usually reply within one business day."
        image={contact.src}
      />
      <ContactDetails />
      <Footer />
    </main>
  );
};

export default ContactPage;
