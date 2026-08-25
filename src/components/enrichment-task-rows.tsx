"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CircleAlert, Globe, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EnrichmentJobView {
  id: string;
  total: number;
  processed: number;
  found: number;
  status: string;
  error?: string | null;
  startedAt?: string | null;
}

type RowState = "done" | "running" | "queued" | "failed";

function RowGlyph({ state }: { state: RowState }) {
  if (state === "done") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-success/15">
        <Check className="size-3 text-success" aria-hidden />
      </span>
    );
  }
  if (state === "running") {
    return (
      <span className="relative flex size-4 items-center justify-center">
        <span className="absolute size-4 animate-ping rounded-full bg-primary/30 motion-reduce:animate-none" />
        <span className="size-2 rounded-full bg-primary" />
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span className="flex size-4 items-center justify-center rounded-full bg-destructive/15">
        <CircleAlert className="size-3 text-destructive" aria-hidden />
      </span>
    );
  }
  return (
    <span className="flex size-4 items-center justify-center">
      <span className="size-2 rounded-full border border-muted-foreground/40" />
    </span>
  );
}

function formatElapsed(ms: number): string {
  const totalS = Math.floor(ms / 1000);
  if (totalS < 60) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(totalS / 60)}m ${String(totalS % 60).padStart(2, "0")}s`;
}

/**
 * Live task rows for an enrichment job — rebuilt after the Beautiful UI
 * task-rows primitive: grouped steps with per-row status glyphs, meters,
 * and a mono elapsed timer.
 */
export function EnrichmentTaskRows({ job }: { job: EnrichmentJobView }) {
  const running = job.status === "RUNNING";
  const done = job.status === "DONE";
  const failed = job.status === "FAILED";

  const startedAtMs = useMemo(
    () => (job.startedAt ? new Date(job.startedAt).getTime() : null),
    [job.startedAt]
  );

  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  useEffect(() => {
    if (!running || !startedAtMs) return;
    const id = setInterval(() => setElapsedMs(Date.now() - startedAtMs), 200);
    return () => clearInterval(id);
  }, [running, startedAtMs]);

  const pct = job.total ? Math.min(100, (job.processed / job.total) * 100) : 0;

  const rows = [
    {
      key: "scan",
      icon: Globe,
      label: "Check business websites",
      meta: `${job.processed}/${job.total}`,
      meterPct: pct,
      state: (failed ? "failed" : done ? "done" : "running") as RowState,
    },
    {
      key: "extract",
      icon: Mail,
      label: "Extract public emails",
      meta: `${job.found} found`,
      meterPct: null,
      state: (failed
        ? "queued"
        : done
          ? "done"
          : job.processed > 0
            ? "running"
            : "queued") as RowState,
    },
  ];

  return (
    <section
      aria-label="Email enrichment progress"
      className="rounded-lg border border-border bg-card px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <h2 className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Finding emails
        </h2>
        <span
          className={cn(
            "rounded-full px-2 py-px text-[11px] font-medium",
            running && "bg-accent text-accent-foreground",
            done && "bg-success/15 text-success",
            failed && "bg-destructive/10 text-destructive"
          )}
        >
          {running ? "Running" : done ? "Done" : "Failed"}
        </span>
        {elapsedMs !== null && (
          <span className="ml-auto font-mono text-xs tabular-nums text-muted-foreground">
            {formatElapsed(elapsedMs)}
          </span>
        )}
      </div>

      <ul className="mt-2.5 divide-y divide-border/60">
        {rows.map(({ key, icon: Icon, label, meta, meterPct, state }) => (
          <li key={key} className="flex items-center gap-2.5 py-2 text-sm">
            <RowGlyph state={state} />
            <Icon className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span
              className={cn(
                "min-w-0 truncate",
                state === "queued" ? "text-muted-foreground" : undefined
              )}
            >
              {label}
            </span>
            {meterPct !== null && (
              <span className="ml-auto flex w-28 shrink-0 items-center gap-2">
                <span className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary transition-all duration-500 ease-fluid"
                    style={{ width: `${meterPct}%` }}
                  />
                </span>
              </span>
            )}
            <span
              className={cn(
                "shrink-0 font-mono text-xs tabular-nums text-muted-foreground",
                meterPct === null && "ml-auto"
              )}
            >
              {meta}
            </span>
          </li>
        ))}
      </ul>

      {done && (
        <p className="mt-1 border-t border-border/60 pt-2 text-sm text-success">
          Checked {job.processed} site{job.processed === 1 ? "" : "s"}, found{" "}
          {job.found} new email{job.found === 1 ? "" : "s"}
        </p>
      )}
      {failed && (
        <p className="mt-1 border-t border-border/60 pt-2 text-sm text-destructive">
          Enrichment failed{job.error ? `: ${job.error}` : ""}
        </p>
      )}
    </section>
  );
}
