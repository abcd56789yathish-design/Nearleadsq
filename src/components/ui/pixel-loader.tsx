"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const CELLS = Array.from({ length: 15 }, (_, i) => ({
  delayMs: (i % 5) * 140 + Math.floor(i / 5) * 90,
}));

/**
 * Pixel-grid loader with staggered shimmer and an optional elapsed-time
 * counter — rebuilt after the Beautiful UI loading-state primitive.
 */
export function PixelLoader({
  label,
  className,
}: {
  label?: string;
  className?: string;
}) {
  const [elapsedS, setElapsedS] = useState(0);

  useEffect(() => {
    if (!label) return;
    const startedAt = Date.now();
    const id = setInterval(() => setElapsedS((Date.now() - startedAt) / 1000), 100);
    return () => clearInterval(id);
  }, [label]);

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ? `${label}, ${elapsedS.toFixed(1)} seconds elapsed` : "Loading"}
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="grid grid-cols-5 gap-[3px]" aria-hidden>
        {CELLS.map(({ delayMs }, i) => (
          <span
            key={i}
            className="pixel-loader-cell size-1.5 rounded-[2px] bg-primary"
            style={{ animationDelay: `${delayMs}ms` }}
          />
        ))}
      </span>
      {label && (
        <span className="font-mono text-xs tabular-nums text-muted-foreground">
          {label} {elapsedS.toFixed(1)}s
        </span>
      )}
    </span>
  );
}
