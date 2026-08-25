import * as React from "react";
import { cn } from "@/lib/utils";

const styles = {
  NEW: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  CONTACTED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  REPLIED: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  WON: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  LOST: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
} as const;

const labels: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  WON: "Won",
  LOST: "Lost",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const style =
    styles[status as keyof typeof styles] ?? styles.LOST;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        style,
        className
      )}
    >
      {labels[status] ?? status}
    </span>
  );
}

export function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground",
        className
      )}
      {...props}
    />
  );
}
