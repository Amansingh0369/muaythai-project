"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useRouter } from "next/navigation";
import { renderToString } from "react-dom/server";
import { X, MapPin, ArrowRight } from "lucide-react";

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
  const svg = renderToString(
    <X
      size={isActive ? 36 : 28}
      strokeWidth={isActive ? 3 : 2.5}
      color={isActive ? "hsl(16, 100%, 50%)" : "white"}
    />
  );
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `<div class="gta-marker ${isActive ? "active" : ""}">
             <div class="gta-x-icon">${svg}</div>
             ${isActive ? '<div class="gta-marker-pulse"></div>' : ""}
           </div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -16],
  });
};

const ICON_INACTIVE = buildIcon(false);
const ICON_ACTIVE = buildIcon(true);

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
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <CenterDetector locations={locations} onSelect={handleSelect} />

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
            onClick={() => router.push("/locations")}
            className="group text-left bg-black/85 border border-white/15 backdrop-blur-sm
                       px-4 py-3 hover:border-primary/60 transition-colors"
          >
            <span className="block text-[10px] uppercase tracking-[0.25em] text-primary font-grotesk font-bold mb-1">
              Camp
            </span>
            <span className="flex items-center justify-between gap-2">
              <span className="gta-popup-title !text-[20px] leading-none">
                {activeLocation.name}
              </span>
              <ArrowRight
                size={16}
                className="text-white/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0"
              />
            </span>
          </button>

          {/* City */}
          <div className="bg-black/85 border border-white/15 backdrop-blur-sm px-4 py-2.5">
            <span className="block text-[10px] uppercase tracking-[0.25em] text-white/40 font-grotesk font-bold mb-0.5">
              City
            </span>
            <span className="flex items-center gap-1.5 text-white text-sm font-semibold">
              <MapPin size={13} className="text-primary shrink-0" />
              {activeLocation.city}
            </span>
          </div>

          {/* Address */}
          <div className="bg-black/85 border border-white/15 backdrop-blur-sm px-4 py-2.5">
            <span className="block text-[10px] uppercase tracking-[0.25em] text-white/40 font-grotesk font-bold mb-0.5">
              Address
            </span>
            <span className="block text-white/80 text-xs leading-snug">
              {activeLocation.address || "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
