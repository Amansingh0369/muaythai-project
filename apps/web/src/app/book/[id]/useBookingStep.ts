"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Step } from "./booking.helpers";

function stepFromUrl(): Step {
  return new URLSearchParams(window.location.search).get("step") === "form" ? "form" : "details";
}

/**
 * Keeps the details/form step in sync with `?step=form` via the History API, so the
 * page never remounts between steps (no refetch, no lost form input) and the browser
 * Back button keeps moving backwards instead of cycling between the two steps.
 */
export function useBookingStep() {
  const [step, setStep] = useState<Step>("details");

  /** True while the current "?step=form" entry is one we pushed. Going back then pops
   *  it rather than pushing a third entry — otherwise Back walks details → form → details. */
  const pushedFormEntry = useRef(false);

  useEffect(() => {
    setStep(stepFromUrl());

    const onPop = () => {
      const next = stepFromUrl();
      setStep(next);
      // Landing on a form entry via history means one already exists behind us.
      pushedFormEntry.current = next === "form";
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goToStep = useCallback((next: Step) => {
    if (next === "form") {
      setStep("form");
      window.history.pushState(null, "", `${window.location.pathname}?step=form`);
      pushedFormEntry.current = true;
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Pop our own entry so history stays linear and Back keeps going backwards.
    if (pushedFormEntry.current) {
      pushedFormEntry.current = false;
      window.history.back(); // popstate sets the step and restores the scroll position
      return;
    }

    // Arrived straight on ?step=form (post-login redirect) — nothing to pop, so rewrite.
    setStep("details");
    window.history.replaceState(null, "", window.location.pathname);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return { step, goToStep };
}
