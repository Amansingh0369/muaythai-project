"use client";

import { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { BookingValues, TEXT_FIELDS } from "./booking.helpers";
import type { GuestInput } from "@/services/order.service";

/** A draft is whatever was in sessionStorage — trust nothing about its shape. */
function guestsFrom(raw: unknown): GuestInput[] | null {
  if (!Array.isArray(raw)) return null;
  const guests = raw.filter(
    (g): g is GuestInput =>
      !!g && typeof g === "object" &&
      typeof (g as GuestInput).full_name === "string" &&
      typeof (g as GuestInput).email === "string"
  );
  return guests.length ? guests : null;
}

/**
 * Drafts the form to sessionStorage. Signing in navigates away and back, so without
 * this a half-filled form would be wiped by the round-trip. Restoring happens on mount,
 * before the profile fetch lands, and the profile only fills blanks — so typed values win.
 */
export function useBookingDraft(
  key: string,
  values: BookingValues,
  setValues: Dispatch<SetStateAction<BookingValues>>,
) {
  // Restore
  useEffect(() => {
    let draft: Partial<BookingValues>;
    try {
      const raw = sessionStorage.getItem(key);
      if (!raw) return;
      draft = JSON.parse(raw);
    } catch {
      return; // A corrupt draft is never worth breaking the page over.
    }

    setValues((prev) => {
      const next = { ...prev };
      TEXT_FIELDS.forEach((field) => {
        const saved = draft[field];
        if (typeof saved === "string" && saved) next[field] = saved;
      });
      // Guests are the one value that is not a string, so they restore on their
      // own terms — and only when the draft actually holds well-formed rows.
      const guests = guestsFrom(draft.guests);
      if (guests && next.guests.length === 0) next.guests = guests;
      return next;
    });
  }, [key, setValues]);

  // Persist
  useEffect(() => {
    // Only the text fields can be trimmed; a named guest is worth drafting too.
    const anythingTyped =
      TEXT_FIELDS.some((field) => values[field].trim()) || values.guests.length > 0;
    if (!anythingTyped) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(values));
    } catch {
      // Private-mode storage failures are harmless — drafting is a convenience.
    }
  }, [key, values]);

  return useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Nothing to clean up.
    }
  }, [key]);
}
