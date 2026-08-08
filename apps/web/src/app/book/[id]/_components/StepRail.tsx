"use client";

import { Check } from "lucide-react";
import type { Step } from "../booking.helpers";

const STEPS = ["Camp Details", "Your Details", "Payment"];

/** Camp details → your details → payment, so the user always knows how far in they are. */
export default function StepRail({ step }: { step: Step }) {
  const activeIndex = step === "details" ? 0 : 1;

  return (
    <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
      {STEPS.map((label, i) => {
        const done = i < activeIndex;
        const active = i === activeIndex;
        return (
          <div key={label} className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-5 h-5 flex items-center justify-center font-grotesk text-[11px] font-bold border ${
                  done
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : active
                      ? "bg-primary border-primary text-black"
                      : "border-white/20 text-white/40"
                }`}
              >
                {done ? <Check size={10} /> : i + 1}
              </span>
              <span
                className={`font-grotesk text-[11px] sm:text-[13px] tracking-[0.25em] uppercase ${
                  active ? "text-white" : done ? "text-white/60" : "text-white/35"
                }`}
              >
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && <span className="w-6 sm:w-10 h-px bg-white/15" />}
          </div>
        );
      })}
    </div>
  );
}
