/**
 * Ad and analytics tag IDs.
 *
 * The values below are the LIVE production tags. To test locally against your
 * own tags instead, set NEXT_PUBLIC_META_PIXEL_ID / NEXT_PUBLIC_GTM_ID in
 * apps/web/.env.local — that file is gitignored, so the production IDs here
 * stay untouched and there is no way to accidentally commit a test ID.
 *
 * Setting an override to an empty string disables that tag entirely (both the
 * script and its <noscript> fallback), which is how you turn tracking off in
 * development without deleting anything.
 *
 * To add a new tag: add its ID here, create a component for it in
 * src/components/Tracking/, and render it from src/components/Tracking/index.tsx.
 */

/** `??` not `||`, so an explicit empty-string override means "disabled" rather than "fall back to production". */
const fromEnv = (override: string | undefined, production: string) => override ?? production;

export const TRACKING_CONFIG = {
  /** Meta (Facebook) Pixel — Events Manager › Data sources */
  META_PIXEL_ID: fromEnv(process.env.NEXT_PUBLIC_META_PIXEL_ID, "1076758284851122"),

  /** Google Tag Manager container — Google Ads conversions are configured inside GTM */
  GTM_ID: fromEnv(process.env.NEXT_PUBLIC_GTM_ID, "GTM-WL9WXCX7"),
};
