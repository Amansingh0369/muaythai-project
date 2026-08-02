"use client";

import { motion } from "motion/react";
import { Mail, Instagram, Youtube, ArrowUpRight } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";
import WhatsAppIcon from "@/components/WhatsAppIcon";

const { contact } = SITE_CONFIG;

const channels = [
  {
    icon: Mail,
    label: "Email",
    value: contact.email,
    href: `mailto:${contact.email}`,
  },
  {
    icon: WhatsAppIcon,
    label: "WhatsApp",
    value: contact.phone,
    href: `https://wa.me/${contact.phone.replace(/\D/g, "")}?text=${encodeURIComponent(contact.whatsappMessage)}`,
    external: true,
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@thisismuaythai.fit",
    href: contact.instagram,
    external: true,
  },
  {
    icon: Youtube,
    label: "YouTube",
    value: "@thisismuaythai",
    href: contact.youtube,
    external: true,
  },
];

const ContactDetails = () => {
  return (
    <section className="bg-background py-20 md:py-28 px-6 md:px-12 lg:px-20">
      <div className="max-w-5xl mx-auto">
        {/* Section label */}
        <div className="flex items-center gap-3 mb-12">
          <span className="w-10 h-[2px] bg-primary" />
          <span className="font-grotesk text-[12px] md:text-[13px] tracking-[0.4em] uppercase text-primary font-bold">
            Reach Out
          </span>
        </div>

        {/* Contact channel cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
          {channels.map((channel, i) => {
            const Icon = channel.icon;
            return (
              <motion.a
                key={channel.label}
                href={channel.href}
                target={channel.external ? "_blank" : undefined}
                rel={channel.external ? "noopener noreferrer" : undefined}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="group relative flex items-center gap-5 border border-white/10 bg-white/[0.02] p-6 md:p-7 hover:border-primary/50 hover:bg-white/[0.04] transition-all duration-300"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center bg-primary/10 border border-primary/30 text-primary group-hover:bg-primary group-hover:text-black transition-colors duration-300">
                  <Icon size={20} />
                </span>
                <span className="flex flex-col">
                  <span className="font-grotesk text-[12px] tracking-[0.3em] uppercase text-white/60 mb-1">
                    {channel.label}
                  </span>
                  <span className="font-barlow font-bold text-lg md:text-xl text-white group-hover:text-primary transition-colors duration-300 break-all">
                    {channel.value}
                  </span>
                </span>
                <ArrowUpRight
                  size={18}
                  className="ml-auto text-white/20 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
                />
              </motion.a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactDetails;
