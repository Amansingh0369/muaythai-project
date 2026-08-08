"use client";

import { Dispatch, SetStateAction, useCallback, useEffect } from "react";
import { BookingField, BookingValues } from "./booking.helpers";

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
      (Object.keys(next) as BookingField[]).forEach((field) => {
        const saved = draft[field];
        if (typeof saved === "string" && saved) next[field] = saved;
      });
      return next;
    });
  }, [key, setValues]);

  // Persist
  useEffect(() => {
    if (!Object.values(values).some((v) => v.trim())) return;
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
