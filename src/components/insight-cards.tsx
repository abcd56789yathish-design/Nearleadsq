"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface InsightItem {
  id: string;
  headline: string;
  meta: string;
}

export interface SparkPoint {
  label: string;
  value: number;
}

/**
 * Paged agent-style insight cards — rebuilt after the Beautiful UI
 * insight-cards primitive, fed exclusively with real workspace metrics.
 */
export function InsightCards({
  items,
  spark = [],
}: {
  items: InsightItem[];
  spark?: SparkPoint[];
}) {
  const [index, setIndex] = useState(0);
  if (!items.length) return null;

  const safeIndex = Math.min(index, items.length - 1);
  const current = items[safeIndex];
  const go = (dir: 1 | -1) =>
    setIndex((i) => (i + dir + items.length) % items.length);

  const maxValue = Math.max(...spark.map((p) => p.value), 1);
  const showSpark = spark.length >= 2;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-wider">
            Insights · {items.length}
          </span>
          <span className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous insight"
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <ChevronLeft className="size-3.5" />
            </button>
            <span className="flex items-center gap-1" role="tablist" aria-label="Insight pages">
              {items.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={i === safeIndex}
                  aria-label={`Insight ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={cn(
                    "size-1.5 cursor-pointer rounded-full transition-colors duration-300 ease-fluid",
                    i === safeIndex ? "bg-primary" : "bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  )}
                />
              ))}
            </span>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next insight"
              className="flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors duration-300 ease-fluid hover:bg-secondary hover:text-secondary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <ChevronRight className="size-3.5" />
            </button>
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-6">
        <div key={current.id} className="rise-in min-w-0">
          <p className="text-base font-medium leading-snug">{current.headline}</p>
          <p className="mt-1.5 font-mono text-xs uppercase tracking-wide text-muted-foreground">
            {current.meta}
          </p>
        </div>
        {showSpark && (
          <span
            className="flex h-12 shrink-0 items-end gap-1"
            aria-hidden
            title={spark.map((p) => `${p.label}: ${p.value}`).join(", ")}
          >
            {spark.map((point, i) => (
              <span
                key={i}
                className="w-2 rounded-sm bg-primary/70"
                style={{ height: `${Math.max(3, (point.value / maxValue) * 44)}px` }}
              />
            ))}
          </span>
        )}
      </CardContent>
    </Card>
  );
}
