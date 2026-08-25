import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ToolChipItem {
  icon: LucideIcon;
  label: string;
}

/**
 * Compact mono operation chips — rebuilt after the Beautiful UI
 * tool-chips primitive. Presentational, safe in server components.
 */
export function ToolChips({
  items,
  className,
}: {
  items: ToolChipItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <span className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      {items.map(({ icon: Icon, label }) => (
        <span
          key={label}
          className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-card px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground shadow-xs"
        >
          <Icon className="size-3 shrink-0 text-primary" aria-hidden />
          <span className="truncate font-mono normal-case">{label}</span>
        </span>
      ))}
    </span>
  );
}
