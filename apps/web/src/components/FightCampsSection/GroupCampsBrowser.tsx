"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Users } from "lucide-react";
import { packageService, type LocationDetails, type Package } from "@/services/package.service";
import PackageRow from "@/components/PackageRow";
import LocationPickerModal from "@/components/LocationPickerModal";
import CampFilterBar from "./CampFilterBar";
import {
  DEFAULT_FILTERS,
  cityOptions,
  durationOptions,
  filterCamps,
  filtersFromParams,
  groupCampsByMonth,
  monthOptions,
  reconcileFilters,
  type CampFilters,
} from "./camp-filters";

const shellClass = "flex flex-col items-center justify-center py-24 gap-4 text-center";

/**
 * The group camps listing: every active GROUP camp, narrowed by month, duration
 * and city. Camps route to their location page, where they are bookable.
 */
const GroupCampsBrowser = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Pre-seeded from the URL (e.g. a "Secure Spot" link arrives with ?city=Phuket).
  const [filters, setFilters] = useState<CampFilters>(() =>
    filtersFromParams(new URLSearchParams(searchParams.toString()))
  );

  // A multi-location camp waiting on the user to pick which location to open.
  const [pickerPkg, setPickerPkg] = useState<Package | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await packageService.getPackages({ kind: "GROUP" });
        if (cancelled) return;
        setPackages(data);
        // Drop any URL-supplied pick these camps don't offer.
        setFilters((current) => reconcileFilters(data, current));
      } catch {
        if (!cancelled) setError("Failed to load group camps. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const months = useMemo(() => monthOptions(packages), [packages]);
  const durations = useMemo(() => durationOptions(packages, filters.month), [packages, filters.month]);
  const cities = useMemo(
    () => cityOptions(packages, filters.month, filters.duration),
    [packages, filters.month, filters.duration]
  );
  const filtered = useMemo(() => filterCamps(packages, filters), [packages, filters]);
  const monthGroups = useMemo(() => groupCampsByMonth(filtered), [filtered]);

  // Changing one filter can strip the options a downstream pick relied on.
  const handleFilterChange = (patch: Partial<CampFilters>) =>
    setFilters((current) => reconcileFilters(packages, { ...current, ...patch }));

  // Land on the location page with the clicked camp scrolled to + flashed, so the
  // user can book it straight from there.
  const goToLocation = (locationId: number, pkgId: number) =>
    router.push(`/locations/${locationId}?highlight=${pkgId}`);

  const handleSelect = (pkg: Package) => {
    const locations = pkg.locations ?? [];
    if (locations.length === 1) {
      goToLocation(locations[0].id, pkg.id);
    } else if (locations.length > 1) {
      setPickerPkg(pkg);
    } else {
      router.push(`/book/${pkg.id}`);
    }
  };

  const handlePickLocation = (location: LocationDetails) => {
    if (!pickerPkg) return;
    const pkgId = pickerPkg.id;
    setPickerPkg(null);
    goToLocation(location.id, pkgId);
  };

  if (isLoading) {
    return (
      <div className={shellClass}>
        <Loader2 className="animate-spin text-primary w-10 h-10" />
        <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/55 animate-pulse">
          Loading Group Camps…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={shellClass}>
        <AlertCircle className="text-red-500/50 w-10 h-10" />
        <p className="font-grotesk text-sm text-white/60">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-8 py-3 bg-white/5 border border-white/10 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-grotesk"
        >
          Retry
        </button>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className={shellClass}>
        <Users className="text-white/10 w-16 h-16" />
        <h3 className="font-barlow font-black italic text-2xl text-white uppercase tracking-tighter">
          No Camps Available
        </h3>
        <p className="font-grotesk text-sm text-white/60 max-w-sm">
          No group camps are currently open for booking. Check back soon.
        </p>
      </div>
    );
  }

  return (
    <>
      <CampFilterBar
        filters={filters}
        months={months}
        durations={durations}
        cities={cities}
        onChange={handleFilterChange}
      />

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center border border-white/10 bg-white/[0.02]">
          <AlertCircle className="w-10 h-10 text-white/15" />
          <p className="font-grotesk text-sm text-white/60 max-w-xs">
            No camps match these filters. Try another month, duration, or city.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-14">
          <AnimatePresence mode="popLayout">
            {monthGroups.map((group) => (
              <motion.section key={group.key ?? "tba"} layout exit={{ opacity: 0 }}>
                <h3 className="inline-flex items-baseline gap-2 bg-primary text-white font-barlow font-black italic text-lg md:text-xl uppercase leading-none px-3.5 py-2 mb-6">
                  {group.label}
                  {group.year && (
                    <span className="font-grotesk font-medium not-italic text-[12px] tracking-[0.2em] text-white/80">
                      {group.year}
                    </span>
                  )}
                </h3>
                <div className="flex flex-col gap-4">
                  {group.camps.map((pkg, i) => (
                    <PackageRow
                      key={pkg.id}
                      pkg={pkg}
                      index={i}
                      ctaLabel="View Camp →"
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              </motion.section>
            ))}
          </AnimatePresence>
        </div>
      )}

      <LocationPickerModal
        campName={pickerPkg?.name ?? null}
        locations={pickerPkg?.locations ?? []}
        onPick={handlePickLocation}
        onClose={() => setPickerPkg(null)}
      />
    </>
  );
};

export default GroupCampsBrowser;
