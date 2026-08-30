"use client";

import { CalendarDays, ChevronDown, Clock, MapPin } from "lucide-react";
import { ANY, formatMonth, type CampFilters } from "./camp-filters";

const selectClass =
  "appearance-none w-full bg-white/[0.05] border border-white/15 text-white font-grotesk text-sm px-4 py-3.5 pr-10 focus:outline-none focus:border-primary/60 transition-colors cursor-pointer [&>option]:bg-black [&>option]:text-white";

interface FilterSelectProps {
  label: string;
  icon: typeof Clock;
  value: string;
  anyLabel: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

const FilterSelect = ({ label, icon: Icon, value, anyLabel, options, onChange }: FilterSelectProps) => (
  <div className="flex-1 space-y-2">
    <label className="flex items-center gap-2 font-grotesk text-[12px] tracking-[0.3em] uppercase text-white/50">
      <Icon size={13} className="text-primary" /> {label}
    </label>
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={selectClass}>
        <option value={ANY}>{anyLabel}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
      />
    </div>
  </div>
);

interface CampFilterBarProps {
  filters: CampFilters;
  /** `YYYY-MM` keys, oldest first. */
  months: string[];
  durations: number[];
  cities: string[];
  onChange: (patch: Partial<CampFilters>) => void;
}

/**
 * Month → Duration → City. Each list is narrowed by the picks above it, so every
 * option shown always leads to at least one camp.
 */
const CampFilterBar = ({ filters, months, durations, cities, onChange }: CampFilterBarProps) => (
  <div className="flex flex-col sm:flex-row gap-4 mb-10">
    <FilterSelect
      label="Month"
      icon={CalendarDays}
      value={filters.month}
      anyLabel="Any month"
      options={months.map((month) => ({ value: month, label: formatMonth(month) }))}
      onChange={(month) => onChange({ month })}
    />
    <FilterSelect
      label="Duration"
      icon={Clock}
      value={filters.duration}
      anyLabel="Any duration"
      options={durations.map((days) => ({
        value: String(days),
        label: `${days} ${days === 1 ? "Day" : "Days"}`,
      }))}
      onChange={(duration) => onChange({ duration })}
    />
    <FilterSelect
      label="City"
      icon={MapPin}
      value={filters.city}
      anyLabel="Any city"
      options={cities.map((city) => ({ value: city, label: city }))}
      onChange={(city) => onChange({ city })}
    />
  </div>
);

export default CampFilterBar;
