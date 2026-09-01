"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Swords } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import { fighterCardService } from "@/services/fighter-card.service";

/** Once a session — a reminder that reappears on every page load is nagging. */
const SHOWN_KEY = "titmt_fighter_card_nudge_shown";

const DURATION_MS = 8000;

/**
 * Toasts someone who has a camp booked but an unfinished fighter card — most
 * often a friend who was booked onto someone else's booking and has just set
 * their password.
 *
 * Their confirmation email already asks them to complete it; without this the
 * app only says so on the profile page, so the email and the site disagree
 * about how important it is.
 *
 * Renders nothing: the toast is Sonner's, bottom-right, already mounted in
 * `Providers`.
 */
export default function FighterCardReminder() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  // Guards against a second fire within one mount, before sessionStorage is set.
  const fired = useRef(false);

  useEffect(() => {
    if (!user || fired.current) return;
    // The profile page carries its own banner — no need to say it twice.
    if (pathname?.startsWith("/profile")) return;

    try {
      if (sessionStorage.getItem(SHOWN_KEY)) return;
    } catch {
      // Private-mode storage failures just mean it can show again later.
    }

    let cancelled = false;
    (async () => {
      try {
        // getMyCard creates the card on first read, so this is safe on load.
        const [profile, card] = await Promise.all([
          userService.getFullProfile(),
          fighterCardService.getMyCard(),
        ]);
        if (cancelled || fired.current) return;

        // Only nudge people who are actually going to a camp.
        const hasBooking = (profile.orders?.length ?? 0) > 0;
        if (!hasBooking || card.is_complete) return;

        fired.current = true;
        try {
          sessionStorage.setItem(SHOWN_KEY, "1");
        } catch {
          // Nothing to remember; it may show again next navigation.
        }

        toast("Your fighter card isn't finished", {
          description: "You have a camp booked — your coaches read it before you arrive.",
          icon: <Swords size={16} className="text-primary" />,
          duration: DURATION_MS,
          action: {
            label: "Complete it",
            onClick: () => router.push("/profile?tab=fighter-card"),
          },
        });
      } catch {
        // No nudge rather than a broken page.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, pathname, router]);

  return null;
}
