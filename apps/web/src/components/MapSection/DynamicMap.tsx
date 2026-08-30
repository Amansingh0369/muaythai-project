"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { renderToString } from "react-dom/server";
import { MapPin, ArrowRight, type LucideIcon } from "lucide-react";

import fighterMarker from "@/assets/fighter-marker.png";
import { MAP_DECORATIONS } from "@/constants/map-decorations";
import { locationService, type Location } from "@/services/location.service";

// Default view — centred on Thailand. No bounds: the map drags freely.
const DEFAULT_CENTER: [number, number] = [13.5, 101.0];
const DEFAULT_ZOOM = 6;

// How close (in pixels) a marker must be to the centre crosshair to be "locked on"
const LOCK_RADIUS_PX = 70;

// A location that has valid, parsed coordinates
type LocatedLocation = Location & { coords: [number, number] };

// latitude/longitude arrive as strings (or null) from the API
function parseCoords(loc: Location): [number, number] | null {
  if (loc.latitude == null || loc.longitude == null) return null;
  const lat =
    typeof loc.latitude === "string" ? parseFloat(loc.latitude) : loc.latitude;
  const lng =
    typeof loc.longitude === "string" ? parseFloat(loc.longitude) : loc.longitude;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return [lat, lng];
}

const buildIcon = (isActive: boolean) => {
  // Source is 1536×1024 (3:2); keep the aspect ratio for the marker box.
  const width = isActive ? 64 : 50;
  const height = Math.round(width * (1024 / 1536));
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div class="gta-marker ${isActive ? "active" : ""}" style="width:${width}px;height:${height}px;">
             <img src="${fighterMarker.src}" alt="camp" class="gta-fighter-icon" style="width:${width}px;" />
             ${isActive ? '<div class="gta-marker-pulse"></div>' : ""}
           </div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height / 2],
    popupAnchor: [0, -Math.round(height / 2)],
  });
};

const ICON_INACTIVE = buildIcon(false);
const ICON_ACTIVE = buildIcon(true);

// ── Decorative ambient POIs (fake, hardcoded) — pure map flavour, non-interactive.
const buildDecoIcon = (Icon: LucideIcon) => {
  const svg = renderToString(
    <Icon size={17} strokeWidth={1.8} color="rgba(255,255,255,0.5)" />
  );
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div class="map-deco">${svg}</div>`,
    iconSize: [17, 17],
    iconAnchor: [8, 8],
  });
};

const DECORATIONS = MAP_DECORATIONS.map((d) => ({
  ...d,
  leafletIcon: buildDecoIcon(d.icon),
}));

/**
 * Watches the map as it is dragged/zoomed and reports which location (if any)
 * currently sits under the fixed centre crosshair — the GTA "lock-on" effect.
 */
function CenterDetector({
  locations,
  onSelect,
}: {
  locations: LocatedLocation[];
  onSelect: (id: number | null) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const update = () => {
      if (!locations.length) {
        onSelect(null);
        return;
      }
      const center = map.getSize().divideBy(2); // crosshair is dead centre
      let bestId: number | null = null;
      let bestDist = Infinity;
      for (const loc of locations) {
        const p = map.latLngToContainerPoint(loc.coords);
        const d = center.distanceTo(p);
        if (d < bestDist) {
          bestDist = d;
          bestId = loc.id;
        }
      }
      onSelect(bestDist <= LOCK_RADIUS_PX ? bestId : null);
    };

    update();
    map.on("move", update);
    map.on("zoom", update);
    return () => {
      map.off("move", update);
      map.off("zoom", update);
    };
  }, [map, locations, onSelect]);

  return null;
}

interface DynamicMapProps {
  onMapReady?: (map: L.Map) => void;
}

export default function DynamicMap({ onMapReady }: DynamicMapProps) {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);

  const [locations, setLocations] = useState<LocatedLocation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    locationService
      .getLocations()
      .then((data) => {
        if (cancelled) return;
        const located = data
          .map((loc) => {
            const coords = parseCoords(loc);
            return coords ? { ...loc, coords } : null;
          })
          .filter((loc): loc is LocatedLocation => loc !== null);
        setLocations(located);
      })
      .catch((err) => {
        console.error("Failed to load map locations", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Stable identity so CenterDetector doesn't re-subscribe on every render
  const handleSelect = useCallback((id: number | null) => {
    setActiveId(id);
  }, []);

  // Click a locked-on location → open its detail page (gallery + camps).
  const goToLocation = useCallback(
    (loc: LocatedLocation) => {
      router.push(`/locations/${loc.id}`);
    },
    [router]
  );

  const activeLocation = locations.find((loc) => loc.id === activeId) ?? null;

  return (
    <div className="w-full h-full relative z-0 bg-black">
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        minZoom={5}
        maxZoom={19}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        ref={(instance) => {
          mapRef.current = instance;
          if (instance) onMapReady?.(instance);
        }}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={true}
      >
        {/*
          Esri's dark canvas, not CARTO's. CARTO now require an API key for the
          raster basemaps and watermark unauthenticated tiles, and are retiring
          raster in favour of vector. This one needs no key.

          Note the axis order: Esri serves {z}/{y}/{x}, not the {z}/{x}/{y} that
          almost every other tile provider uses. Swapping them silently returns
          the wrong part of the world rather than an error.
        */}
        {/*
          Crushed to black by .map-tiles-black in globals.css: Esri's canvas is
          a dark grey whose darkest pixel measures 23/255, so on its own it sits
          well above the near-black the rest of the site uses.
        */}
        <TileLayer
          className="map-tiles-black"
          attribution="&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors"
          url="https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        />

        <CenterDetector locations={locations} onSelect={handleSelect} />

        {/* Decorative ambient POIs — fake flavour, don't capture clicks */}
        {DECORATIONS.map((deco, i) => (
          <Marker
            key={`deco-${i}`}
            position={deco.coords}
            icon={deco.leafletIcon}
            interactive={false}
            keyboard={false}
          />
        ))}

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={loc.coords}
            icon={activeId === loc.id ? ICON_ACTIVE : ICON_INACTIVE}
            eventHandlers={{
              // Click a marker to glide it under the crosshair
              click: () => mapRef.current?.panTo(loc.coords),
            }}
          />
        ))}
      </MapContainer>

      {/* Fixed GTA-style reticle — thin "+" with an empty centre, on top of every map layer */}
      <div className={`gta-crosshair ${activeLocation ? "locked" : ""}`}>
        <span className="gta-crosshair-line gta-crosshair-line--h" />
        <span className="gta-crosshair-line gta-crosshair-line--v" />
      </div>

      {/* Drag a camp under the crosshair → its details stack appears top-right */}
      {activeLocation && (
        <div
          key={activeLocation.id}
          className="gta-details-panel absolute top-4 right-4 z-[1000]
                     w-[min(280px,calc(100vw-32px))] flex flex-col gap-2"
        >
          {/* Name */}
          <button
            onClick={() => goToLocation(activeLocation)}
            className="group text-left bg-black/85 border border-white/15 backdrop-blur-sm
                       px-4 py-3 hover:border-primary/60 transition-colors"
          >
            <span className="block text-[12px] uppercase tracking-[0.25em] text-primary font-grotesk font-bold mb-1">
              View Location
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="gta-popup-title !text-[20px] leading-none">
                {activeLocation.name}
              </span>
              <ArrowRight
                size={16}
                className="text-white/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </span>
          </button>

          {/* City */}
          <div className="bg-black/85 border border-white/15 backdrop-blur-sm px-4 py-2.5">
            <span className="block text-[12px] uppercase tracking-[0.25em] text-white/60 font-grotesk font-bold mb-0.5">
              City
            </span>
            <span className="flex items-center gap-1.5 text-white text-sm font-semibold">
              <MapPin size={13} className="text-primary shrink-0" />
              {activeLocation.city}
            </span>
          </div>

          {/* Address */}
          <div className="bg-black/85 border border-white/15 backdrop-blur-sm px-4 py-2.5">
            <span className="block text-[12px] uppercase tracking-[0.25em] text-white/60 font-grotesk font-bold mb-0.5">
              Address
            </span>
            <span className="block text-white/80 text-[13px] leading-snug">
              {activeLocation.address || "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
