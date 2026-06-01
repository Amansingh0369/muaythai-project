"use client";

import { useInView } from "motion/react";
import { useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Loader2, Plus, Minus } from "lucide-react";
import type { Map as LeafletMap } from "leaflet";

const DynamicMap = dynamic(() => import("./DynamicMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#0a0a0a] text-white">
      <Loader2 className="animate-spin text-primary w-10 h-10 mb-3" />
      <span className="font-grotesk tracking-[0.3em] uppercase text-xs font-bold animate-pulse">
        Loading Map...
      </span>
    </div>
  ),
});

const MapSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);

  const isInView = useInView(sectionRef, { once: true, margin: "-10% 0px" });

  const onMapReady = useCallback((map: LeafletMap) => {
    leafletMapRef.current = map;
  }, []);

  return (
    <section id="map" ref={sectionRef} className="relative bg-black h-[calc(100svh-98px)]">
      <div className="h-full w-full overflow-hidden relative">

        {/* Map fills the whole section */}
        <div className="absolute inset-0 z-0">
          {isInView && <DynamicMap onMapReady={onMapReady} />}
        </div>

        {/* Zoom controls — bottom-right on all screen sizes */}
        <div className="absolute bottom-8 right-4 z-30 flex flex-col gap-1">
          <button
            onClick={() => leafletMapRef.current?.zoomIn()}
            aria-label="Zoom in"
            className="w-10 h-10 flex items-center justify-center
                       bg-black/80 border border-white/20 text-white
                       hover:bg-white hover:text-black
                       active:scale-95 transition-all duration-200"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => leafletMapRef.current?.zoomOut()}
            aria-label="Zoom out"
            className="w-10 h-10 flex items-center justify-center
                       bg-black/80 border border-white/20 text-white
                       hover:bg-white hover:text-black
                       active:scale-95 transition-all duration-200"
          >
            <Minus size={16} />
          </button>
        </div>

      </div>
    </section>
  );
};

export default MapSection;
