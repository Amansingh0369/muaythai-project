"use client";

import { Search, X } from "lucide-react";

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  /** Optional "12 of 340" style hint shown while a query is active. */
  hint?: string;
}

/**
 * The dashboard's search box. Searching always runs over the whole dataset,
 * not the visible page — the pager follows the results rather than limiting
 * them.
 */
export function SearchField({ value, onChange, placeholder, hint }: SearchFieldProps) {
  return (
    <div className="glass-surface p-6 rounded-3xl border border-white/10 bg-white/5 flex items-center gap-3 group relative overflow-hidden">
      <Search className="w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors shrink-0" />
      <input
        type="text"
        placeholder={placeholder}
        className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder:text-white/20"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <>
          {hint && (
            <span className="text-[10px] text-white/30 font-black uppercase tracking-widest whitespace-nowrap hidden sm:block">
              {hint}
            </span>
          )}
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      )}
      <div className="absolute bottom-0 left-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left w-full" />
    </div>
  );
}
