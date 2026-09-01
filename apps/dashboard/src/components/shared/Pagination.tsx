"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@repo/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** How many rows the filter matched, across every page. */
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  /** Plural noun for the count line — "students", "bookings". */
  noun: string;
}

/** At most this many numbered buttons; the window slides around the current page. */
const WINDOW = 5;

function pageWindow(page: number, pageCount: number): number[] {
  const start = Math.max(1, Math.min(page - Math.floor(WINDOW / 2), pageCount - WINDOW + 1));
  const end = Math.min(pageCount, start + WINDOW - 1);
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  noun,
}: PaginationProps) {
  if (total === 0) return null;

  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
        Showing {first}–{last} of {total} {noun}
      </p>

      {pageCount > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="Previous page"
            className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {pageWindow(page, pageCount).map((n) => (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "w-11 h-11 rounded-xl border text-xs font-black transition-all active:scale-95",
                n === page
                  ? "bg-primary/15 border-primary/50 text-white"
                  : "bg-white/5 border-white/5 text-white/40 hover:text-white hover:border-white/20"
              )}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page === pageCount}
            aria-label="Next page"
            className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-white/20 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
