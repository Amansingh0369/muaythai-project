"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Images } from "lucide-react";

export interface CarouselImage {
  image: string;
  caption?: string | null;
}

interface ImageCarouselProps {
  images: CarouselImage[];
  /** Auto-advance interval in ms (0 disables autoplay). */
  interval?: number;
  className?: string;
}

/**
 * Theme-matched image carousel: auto-advances, pauses on hover, and exposes
 * prev/next ( < > ) controls plus dot indicators. Falls back to a placeholder
 * when there are no images.
 */
const ImageCarousel = ({ images, interval = 4500, className = "" }: ImageCarouselProps) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = images.length;

  const go = useCallback(
    (dir: 1 | -1) => setIndex((i) => (i + dir + count) % count),
    [count]
  );

  // Keep index in range if the image set changes.
  useEffect(() => {
    setIndex((i) => (i >= count ? 0 : i));
  }, [count]);

  // Autoplay (paused on hover / when only one image).
  useEffect(() => {
    if (paused || interval <= 0 || count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [paused, interval, count]);

  if (count === 0) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center gap-3 bg-white/[0.03] border border-white/10 text-white/30 ${className}`}
      >
        <Images className="w-10 h-10" />
        <span className="font-grotesk text-[12px] tracking-[0.3em] uppercase">No images yet</span>
      </div>
    );
  }

  const current = images[index];

  return (
    <div
      className={`relative overflow-hidden bg-black group ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="popLayout">
        <motion.img
          key={index}
          src={current.image}
          alt={current.caption ?? "Location image"}
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {/* Readability gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

      {/* Caption */}
      {current.caption && (
        <div className="absolute bottom-4 left-4 right-16 z-10">
          <span className="font-grotesk text-[12px] md:text-[13px] text-white/85 bg-black/50 backdrop-blur-sm px-3 py-1.5 inline-block">
            {current.caption}
          </span>
        </div>
      )}

      {count > 1 && (
        <>
          {/* Prev / Next ( < > ) */}
          <button
            type="button"
            aria-label="Previous image"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-sm border border-white/15 text-white/80 hover:text-primary hover:border-primary/60 transition-colors md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 flex items-center justify-center bg-black/50 backdrop-blur-sm border border-white/15 text-white/80 hover:text-primary hover:border-primary/60 transition-colors md:opacity-0 md:group-hover:opacity-100"
          >
            <ChevronRight size={20} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageCarousel;
