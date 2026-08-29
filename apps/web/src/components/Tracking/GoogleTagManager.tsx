"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { TRACKING_CONFIG } from "@/lib/tracking-config";

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const GTM_ID = TRACKING_CONFIG.GTM_ID;

/**
 * Event name to build the GTM trigger on: Trigger type "Custom Event",
 * event name "route_change". GTM does NOT push gtm.historyChange for App
 * Router navigations on its own (verified: the dataLayer gained no entries
 * across a client-side /privacy -> /terms navigation), so without this push
 * an All Pages trigger silently misses every in-app route change.
 */
const ROUTE_CHANGE_EVENT = "route_change";

export function GoogleTagManager() {
  const pathname = usePathname();
  // Tracks the last path actually reported. Comparing paths (rather than
  // flagging "first render") keeps this correct under React Strict Mode,
  // which invokes effects twice on mount in development.
  const lastPath = useRef<string | null>(null);

  useEffect(() => {
    if (!GTM_ID) return;
    // gtm.js already fires for the initial document load.
    if (lastPath.current === null) {
      lastPath.current = pathname;
      return;
    }
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;

    window.dataLayer?.push({
      event: ROUTE_CHANGE_EVENT,
      page_path: pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname]);

  if (!GTM_ID) return null;

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');`}
    </Script>
  );
}

export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
