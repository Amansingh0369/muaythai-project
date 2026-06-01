"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { SITE_CONFIG } from "@repo/utils";
import { useRouter } from "next/navigation";
import { renderToString } from "react-dom/server";
import { X } from "lucide-react";

import phuketImg from "@/assets/phuket.jpg";
import bangkokImg from "@/assets/bangkok.jpg";
import chiangmaiImg from "@/assets/chiangmai.jpg";
import krabiImg from "@/assets/krabi.jpg";
import kohsamuiImg from "@/assets/kohsamui.jpg";

const locationImages: Record<string, any> = {
  Phuket: phuketImg,
  Bangkok: bangkokImg,
  "Chiang Mai": chiangmaiImg,
  Krabi: krabiImg,
  "Koh Samui": kohsamuiImg,
};

const REAL_COORDS: Record<string, [number, number]> = {
  "Chiang Mai": [18.7904, 98.9847],
  Bangkok: [13.7539, 100.5014],
  Phuket: [7.8906, 98.3981],
  Krabi: [8.085, 98.9063],
  "Koh Samui": [9.512, 100.0139],
};

// Thailand bounding box — users cannot pan outside this
const THAILAND_BOUNDS: L.LatLngBoundsExpression = [
  [4.5, 96.5],
  [21.5, 106.5],
];

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

// Listens to Leaflet popup events and swaps marker icons imperatively
function MapEventsHandler({
  markerRefs,
}: {
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();

  useEffect(() => {
    const onOpen = (e: L.PopupEvent) => {
      Object.values(markerRefs.current).forEach((marker) => {
        if (!marker) return;
        marker.setIcon(marker.getPopup() === e.popup ? ICON_ACTIVE : ICON_INACTIVE);
      });
    };
    const onClose = () => {
      Object.values(markerRefs.current).forEach((marker) => {
        marker?.setIcon(ICON_INACTIVE);
      });
    };

    map.on("popupopen", onOpen);
    map.on("popupclose", onClose);
    return () => {
      map.off("popupopen", onOpen);
      map.off("popupclose", onClose);
    };
  }, [map, markerRefs]);

  return null;
}

interface DynamicMapProps {
  onMapReady?: (map: L.Map) => void;
}

export default function DynamicMap({ onMapReady }: DynamicMapProps) {
  const router = useRouter();
  const mapRef = useRef<L.Map | null>(null);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  return (
    <div className="w-full h-full relative z-0 bg-black">
      <MapContainer
        center={[13.0, 101.5]}
        zoom={6}
        minZoom={6}
        maxZoom={19}
        maxBounds={THAILAND_BOUNDS}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", background: "#0a0a0a" }}
        ref={(instance) => {
          mapRef.current = instance;
          if (instance) onMapReady?.(instance);
        }}
        zoomControl={false}
        attributionControl={false}
        worldCopyJump={false}
      >
        <TileLayer
          attribution=""
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        <MapEventsHandler markerRefs={markerRefs} />

        {SITE_CONFIG.locations.map((location) => {
          const coords = REAL_COORDS[location.name];
          if (!coords) return null;

          const imgSrc = locationImages[location.name]?.src ?? bangkokImg.src;

          return (
            <Marker
              key={location.name}
              position={coords}
              icon={ICON_INACTIVE}
              ref={(r) => {
                if (r) markerRefs.current[location.name] = r;
              }}
            >
              <Popup className="gta-popup" closeButton={false} autoPan={true}>
                <div
                  className="gta-popup-content"
                  onClick={() => router.push("/locations")}
                >
                  <div className="gta-popup-image-wrapper">
                    <img src={imgSrc} alt={location.name} className="gta-popup-image" />
                    <div className="gta-popup-overlay" />
                  </div>
                  <div className="gta-popup-info">
                    <div className="gta-popup-header">
                      <span className="gta-popup-title">{location.name}</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
