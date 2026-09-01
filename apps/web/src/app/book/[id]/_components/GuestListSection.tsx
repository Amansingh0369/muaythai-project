"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Plus, UserPlus, X } from "lucide-react";
import type { GuestInput } from "@/services/order.service";
import { GuestErrors, MAX_GUESTS, MAX_PARTICIPANTS } from "../booking.helpers";
import { FormField, SectionHeader, TextInput } from "./FormControls";

interface GuestListSectionProps {
  buyerName: string;
  buyerEmail: string;
  guests: GuestInput[];
  errors: GuestErrors;
  /** Guest-list rejections from the API, shown verbatim — the copy is customer-ready. */
  serverErrors: string[];
  disabled: boolean;
  onAdd: () => void;
  onChange: (index: number, field: keyof GuestInput, value: string) => void;
  onRemove: (index: number) => void;
}

/**
 * Books friends onto the same payment.
 *
 * The buyer is rendered as a fixed first row rather than left implicit: adding
 * a friend extends their own place, it never replaces it, and that has to be
 * visible before anyone types an address.
 */
export default function GuestListSection({
  buyerName,
  buyerEmail,
  guests,
  errors,
  serverErrors,
  disabled,
  onAdd,
  onChange,
  onRemove,
}: GuestListSectionProps) {
  const atLimit = guests.length >= MAX_GUESTS;

  return (
    <>
      <SectionHeader icon={<UserPlus size={14} />} title="Bring a Friend" />
      <p className="font-grotesk text-[13px] text-white/55 mb-5">
        Book their place on the same payment. We&apos;ll email them their own
        confirmation and set up their account.
      </p>

      <div className="flex flex-col gap-3">
        {/* The buyer — always on the booking, never removable. */}
        <div className="flex items-center gap-3 border border-white/[0.08] bg-white/[0.03] px-4 py-3">
          <span className="w-6 h-6 shrink-0 border border-primary/30 bg-primary/10 text-primary flex items-center justify-center font-grotesk text-[11px] font-bold">
            1
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-grotesk text-sm text-white truncate">
              {buyerName || "You"}
            </p>
            <p className="font-grotesk text-[13px] text-white/50 truncate">{buyerEmail}</p>
          </div>
          <span className="font-grotesk text-[12px] tracking-[0.28em] uppercase text-primary shrink-0">
            You
          </span>
        </div>

        <AnimatePresence initial={false}>
          {guests.map((guest, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-3"
            >
              <span className="w-6 h-6 mt-2.5 shrink-0 border border-white/12 bg-white/[0.04] text-white/50 flex items-center justify-center font-grotesk text-[11px] font-bold">
                {i + 2}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-w-0">
                <FormField label="Their Name" required error={errors[i]?.full_name}>
                  <TextInput
                    placeholder="Ben Friend"
                    value={guest.full_name}
                    hasError={!!errors[i]?.full_name}
                    disabled={disabled}
                    onChange={(e) => onChange(i, "full_name", e.target.value)}
                  />
                </FormField>
                <FormField label="Their Email" required error={errors[i]?.email}>
                  <TextInput
                    type="email"
                    placeholder="ben@example.com"
                    value={guest.email}
                    hasError={!!errors[i]?.email}
                    disabled={disabled}
                    onChange={(e) => onChange(i, "email", e.target.value)}
                  />
                </FormField>
              </div>

              <button
                type="button"
                onClick={() => onRemove(i)}
                disabled={disabled}
                aria-label={`Remove fighter ${i + 2}`}
                title="Remove"
                className="w-9 h-9 mt-6 shrink-0 border border-white/12 bg-white/[0.04] text-white/45 flex items-center justify-center hover:text-red-400 hover:border-red-500/40 transition-colors duration-200 disabled:opacity-40"
              >
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Anything the server rejected — its wording is written for the customer. */}
      <AnimatePresence>
        {serverErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex flex-col gap-1.5 px-4 py-3 bg-red-500/[0.07] border border-red-500/20"
          >
            {serverErrors.map((message, i) => (
              <p key={i} className="font-grotesk text-[13px] text-red-300 flex items-start gap-2">
                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                {message}
              </p>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-4">
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled || atLimit}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-primary/30 bg-primary/[0.06] font-barlow font-bold text-[13px] tracking-[0.2em] uppercase text-primary hover:bg-primary/10 transition-colors duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Plus size={13} />
          Add another fighter
        </button>

        <p className="font-grotesk text-[13px] text-white/50">
          {atLimit
            ? `A booking covers up to ${MAX_PARTICIPANTS} people, including you.`
            : guests.length > 0
              ? `${guests.length + 1} fighters on this booking`
              : "Booking for yourself? Just carry on below."}
        </p>
      </div>
    </>
  );
}
