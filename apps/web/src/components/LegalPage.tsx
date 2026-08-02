"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface TableRow {
  condition: string;
  refund: string;
}

interface Section {
  heading: string;
  body: string | null;
  table?: TableRow[];
}

interface LegalPageProps {
  title: string;
  effectiveDate: string;
  intro: string;
  sections: Section[];
}

export default function LegalPage({ title, effectiveDate, intro, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors duration-200 font-grotesk text-sm"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-grotesk text-[13px] text-white/60 uppercase tracking-widest">{title}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="border-b border-white/10 py-16 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="w-8 h-[2px] bg-primary" />
            <span className="font-grotesk text-[12px] tracking-[0.4em] uppercase text-primary font-bold">
              Legal
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-barlow font-black italic text-4xl md:text-6xl uppercase leading-tight mb-4"
          >
            {title}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-grotesk text-white/60 text-sm"
          >
            Effective Date: {effectiveDate}
          </motion.p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-4xl mx-auto px-6 py-14 md:py-20">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="font-grotesk text-white/70 text-base leading-relaxed mb-14 border-l-2 border-primary/60 pl-5"
        >
          {intro}
        </motion.p>

        <div className="space-y-12">
          {sections.map((section, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + idx * 0.04 }}
            >
              <h2 className="font-barlow font-black italic text-xl md:text-2xl uppercase text-white mb-4 tracking-wide">
                {section.heading}
              </h2>
              {section.body && (
                <p className="font-grotesk text-white/60 text-sm md:text-base leading-relaxed">
                  {section.body}
                </p>
              )}
              {section.table && (
                <div className="mt-4 border border-white/10 overflow-hidden">
                  <table className="w-full text-sm font-grotesk">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="text-left px-4 py-3 text-white/70 uppercase tracking-widest text-[12px] font-bold w-2/3">
                          Cancellation Window
                        </th>
                        <th className="text-left px-4 py-3 text-white/70 uppercase tracking-widest text-[12px] font-bold">
                          Refund
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {section.table.map((row, i) => (
                        <tr
                          key={i}
                          className="border-b border-white/[0.06] hover:bg-white/[0.03] transition-colors"
                        >
                          <td className="px-4 py-3 text-white/70">{row.condition}</td>
                          <td className="px-4 py-3 text-primary font-semibold">{row.refund}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom links */}
        <div className="mt-20 pt-8 border-t border-white/10 flex flex-wrap gap-6 font-grotesk text-[13px] text-white/55">
          <Link href="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
          <Link href="/refund-policy" className="hover:text-primary transition-colors">Cancellation & Refund Policy</Link>
        </div>
      </div>
    </main>
  );
}
