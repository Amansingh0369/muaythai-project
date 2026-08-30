"use client";

import { useEffect, useRef } from "react";

interface Ember {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  drift: number;
  hue: number;
}

interface EmberFieldProps {
  /** How many embers are alive at once. */
  count?: number;
  className?: string;
}

/**
 * Embers drifting up past the card, on a 2D canvas rather than DOM nodes so a
 * few dozen of them cost one composited layer instead of one per particle.
 * Sits outside the card's 3D context, so it never intersects the flipping face.
 */
export default function EmberField({ count = 34, className = "" }: EmberFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Honour the OS setting — a drifting field of sparks is exactly the kind of
    // ambient motion reduced-motion users are asking us to stop.
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0;
    let h = 0;
    const embers: Ember[] = [];

    /**
     * Embers appear anywhere in the field rather than rising off the bottom
     * edge, so the card sits inside a drifting cloud instead of over a fire.
     * They fade in wherever they start, so appearing mid-air reads as an ember
     * catching the light rather than popping into existence.
     */
    const spawn = (): Ember => {
      const maxLife = 200 + Math.random() * 260;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        // Drifts in any direction, with a gentle upward bias
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(0.02 + Math.random() * 0.3),
        size: 0.7 + Math.random() * 1.9,
        // Stagger the first generation so they don't all pulse together
        life: Math.random() * maxLife,
        maxLife,
        drift: Math.random() * Math.PI * 2,
        // Ember orange through to a hotter yellow
        hue: 18 + Math.random() * 26,
      };
    };

    const resize = () => {
      w = canvas.offsetWidth;
      h = canvas.offsetHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    if (w === 0 || h === 0) return;
    for (let i = 0; i < count; i++) embers.push(spawn());

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      // Additive, so overlapping embers bloom instead of stacking flat.
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life += 1;
        if (e.life > e.maxLife) {
          embers[i] = spawn();
          continue;
        }

        e.drift += 0.012;
        e.x += e.vx + Math.sin(e.drift) * 0.24;
        e.y += e.vy + Math.cos(e.drift * 0.7) * 0.06;

        // Wrap, so the cloud stays evenly spread across the whole field.
        if (e.y < -14) e.y = h + 14;
        if (e.x < -14) e.x = w + 14;
        else if (e.x > w + 14) e.x = -14;

        // Fade in over the first fifth of life, out over the last third.
        const t = e.life / e.maxLife;
        const alpha = Math.min(t * 5, 1) * Math.min((1 - t) * 3, 1) * 0.85;
        const flicker = 0.75 + Math.sin(e.drift * 3.1) * 0.25;

        const glow = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.size * 4);
        glow.addColorStop(0, `hsla(${e.hue}, 100%, 68%, ${alpha * flicker})`);
        glow.addColorStop(0.4, `hsla(${e.hue}, 100%, 52%, ${alpha * flicker * 0.45})`);
        glow.addColorStop(1, `hsla(${e.hue}, 100%, 45%, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Hot core
        ctx.fillStyle = `hsla(${e.hue + 14}, 100%, 82%, ${alpha * flicker})`;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = "source-over";
      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none ${className}`}
      style={{ display: "block" }}
    />
  );
}
