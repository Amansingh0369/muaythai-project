"use client";

/** Bulleted camp content. The bullet hangs, so a point that wraps stays indented
 *  under its own text rather than running back under the marker. */
export default function PointList({
  points,
  className = "text-[15px] text-white/90",
  gap = "gap-3",
  spacing = "space-y-3",
}: {
  points: string[];
  className?: string;
  gap?: string;
  spacing?: string;
}) {
  return (
    <ul className={spacing}>
      {points.map((point) => (
        <li key={point} className={`flex items-start ${gap} font-grotesk leading-relaxed ${className}`}>
          <span aria-hidden className="text-primary shrink-0">
            •
          </span>
          <span className="min-w-0 break-words">{point}</span>
        </li>
      ))}
    </ul>
  );
}
