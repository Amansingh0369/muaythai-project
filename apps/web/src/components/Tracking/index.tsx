import { GoogleTagManager, GoogleTagManagerNoScript } from "./GoogleTagManager";
import { MetaPixel, MetaPixelNoScript } from "./MetaPixel";

/** All tag scripts. Rendered once from the root layout. */
export function TrackingScripts() {
  return (
    <>
      <GoogleTagManager />
      <MetaPixel />
    </>
  );
}

/** <noscript> fallbacks. Must sit as plain markup inside <body>. */
export function TrackingNoScript() {
  return (
    <>
      <GoogleTagManagerNoScript />
      <MetaPixelNoScript />
    </>
  );
}
