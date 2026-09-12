"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Download,
  Globe,
  Mail,
  MailPlus,
  MessageCircle,
  Phone,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { WhatsAppModal, type LeadMessageTarget } from "@/components/whatsapp-modal";
import { CsvImportModal } from "@/components/csv-import-modal";
import { EnrichmentTaskRows } from "@/components/enrichment-task-rows";
import { categoryLabel } from "@/lib/categories";
import { cn } from "@/lib/utils";

export interface LeadRow {
  id: string;
  name: string;
  category: string | null;
  address: string | null;
  phoneE164: string | null;
  email: string | null;
  website: string | null;
  status: string;
  followUpAt?: string | null;
}

interface LeadsResponse {
  total: number;
  page: number;
  pages: number;
  leads: LeadRow[];
  statusCounts: Record<string, number>;
}

interface JobState {
  id: string;
  total: number;
  processed: number;
  found: number;
  status: string;
  error?: string | null;
  startedAt?: string | null;
}

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "NEW", label: "New" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "REPLIED", label: "Replied" },
  { value: "WON", label: "Won" },
  { value: "LOST", label: "Lost" },
];

export function LeadsTable({
  initialSearchId,
  initialFollowUp,
  templates = [],
  senderName = null,
}: {
  initialSearchId?: string;
  initialFollowUp?: string;
  templates?: { id: string; name: string; body: string }[];
  senderName?: string | null;
}) {
  const [qInput, setQInput] = useState("");
  const debouncedQ = useDebounce(qInput, 350);
  const [status, setStatus] = useState("all");
  const [hasWebsite, setHasWebsite] = useState("any");
  const [hasPhone, setHasPhone] = useState("any");
  const [hasEmail, setHasEmail] = useState("any");
  const validFollowUps = ["due", "week"];
  const [hasFollowUp, setHasFollowUp] = useState(
    validFollowUps.includes(initialFollowUp ?? "") ? (initialFollowUp as string) : "any"
  );
  const [page, setPage] = useState(1);

  const [data, setData] = useState<LeadsResponse | null>(null);
  const loading = data === null;
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [job, setJob] = useState<JobState | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [messageTarget, setMessageTarget] = useState<LeadMessageTarget | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (initialSearchId) p.set("searchId", initialSearchId);
    if (debouncedQ.trim()) p.set("q", debouncedQ.trim());
    if (status !== "all") p.set("status", status);
    if (hasWebsite !== "any") p.set("hasWebsite", hasWebsite);
    if (hasPhone !== "any") p.set("hasPhone", hasPhone);
    if (hasEmail !== "any") p.set("hasEmail", hasEmail);
    if (hasFollowUp !== "any") p.set("followUp", hasFollowUp);
    return p.toString();
  }, [initialSearchId, debouncedQ, status, hasWebsite, hasPhone, hasEmail, hasFollowUp]);

  // Reset to first page whenever filters change.
  const [prevParams, setPrevParams] = useState(params);
  if (!Object.is(prevParams, params)) {
    setPrevParams(params);
    setPage(1);
  }

  // Single source of truth for fetching: any filter/page change re-runs this.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/leads?${params}&page=${page}&pageSize=${PAGE_SIZE}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const payload: LeadsResponse = await res.json();
        if (cancelled) return;
        setData(payload);
        setSelected(new Set());
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [params, page, refreshKey]);

  // Poll active enrichment job.
  useEffect(() => {
    if (!job || job.status === "DONE" || job.status === "FAILED") return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/enrich/${job.id}`);
        if (!res.ok) return;
        const next: JobState = await res.json();
        setJob(next);
        if (next.status === "DONE" || next.status === "FAILED") {
          setRefreshKey((k) => k + 1); // refetch leads with fresh emails
          setTimeout(
            () => setJob((current) => (current?.id === next.id ? null : current)),
            4000
          );
        }
      } catch {
        // transient network error — keep polling
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [job]);

  function bumpDataVersion() {
    setRefreshKey((k) => k + 1);
  }

  async function startEnrichment(leadIds?: string[]) {
    setActionError(null);
    try {
      const body = leadIds
        ? { leadIds }
        : initialSearchId
          ? { searchId: initialSearchId }
          : undefined;
      if (!body) {
        setActionError("Select leads or run from a specific search first");
        return;
      }
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json();
      if (!res.ok) {
        setActionError(payload.error ?? "Could not start enrichment");
        return;
      }
      setJob({
        id: payload.jobId,
        total: payload.total,
        processed: 0,
        found: 0,
        status: "RUNNING",
        startedAt: payload.startedAt ?? new Date().toISOString(),
      });
    } catch {
      setActionError("Network error — please try again");
    }
  }

  const rows = data?.leads ?? [];
  const allOnPageSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const enrichableSelected = rows.filter(
    (r) => selected.has(r.id) && r.website && !r.email
  ).length;

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function changeStatus(leadId: string, newStatus: string) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            leads: prev.leads.map((lead) =>
              lead.id === leadId ? { ...lead, status: newStatus } : lead
            ),
          }
        : prev
    );
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
  }

  function changeFollowUp(leadId: string, value: string | null) {
    setData((prev) =>
      prev
        ? {
            ...prev,
            leads: prev.leads.map((lead) =>
              lead.id === leadId ? { ...lead, followUpAt: value } : lead
            ),
          }
        : prev
    );
    void fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ followUpAt: value }),
    });
  }

  const filtersActive =
    qInput.trim() !== "" ||
    status !== "all" ||
    hasWebsite !== "any" ||
    hasPhone !== "any" ||
    hasEmail !== "any" ||
    hasFollowUp !== "any";

  function clearFilters() {
    setQInput("");
    setStatus("all");
    setHasWebsite("any");
    setHasPhone("any");
    setHasEmail("any");
    setHasFollowUp("any");
    setPage(1);
  }

  const statusCounts = data?.statusCounts;
  const statusChipCount = (value: string): number | null => {
    if (!statusCounts) return null;
    if (value === "all") {
      return Object.values(statusCounts).reduce((sum, n) => sum + n, 0);
    }
    return statusCounts[value] ?? 0;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          placeholder="Filter by name…"
          className="w-44"
        />
        <Select value={hasWebsite} onChange={(e) => setHasWebsite(e.target.value)} className="w-40">
          <option value="any">Website: any</option>
          <option value="yes">Has website</option>
          <option value="no">No website</option>
        </Select>
        <Select value={hasPhone} onChange={(e) => setHasPhone(e.target.value)} className="w-40">
          <option value="any">Phone: any</option>
          <option value="yes">Has phone</option>
          <option value="no">No phone</option>
        </Select>
        <Select value={hasEmail} onChange={(e) => setHasEmail(e.target.value)} className="w-40">
          <option value="any">Email: any</option>
          <option value="yes">Has email</option>
          <option value="no">Missing email</option>
        </Select>
        <Select
          value={hasFollowUp}
          onChange={(e) => setHasFollowUp(e.target.value)}
          className="w-44"
        >
          <option value="any">Follow-up: any</option>
          <option value="due">Due (overdue + today)</option>
          <option value="week">Next 7 days</option>
        </Select>
        <Button variant="ghost" size="icon" onClick={bumpDataVersion} title="Refresh">
          <RefreshCw className={loading ? "animate-spin" : undefined} />
        </Button>
        <a
          href={`/api/leads/export?${params}`}
          download
          title="Export current view to CSV"
        >
          <Button variant="ghost" size="icon" type="button">
            <Download />
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          title="Import leads from a CSV file"
          onClick={() => setShowImport(true)}
        >
          <Upload />
        </Button>

        <div className="ml-auto flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {data && (
            <span>
              {data.total.toLocaleString()} lead{data.total === 1 ? "" : "s"}
              {selected.size > 0 && ` · ${selected.size} selected`}
            </span>
          )}
          <Button
            size="sm"
            variant="secondary"
            disabled={enrichableSelected === 0 || job?.status === "RUNNING"}
            onClick={() =>
              startEnrichment(
                rows.filter((r) => selected.has(r.id) && r.website && !r.email).map((r) => r.id)
              )
            }
            title={
              enrichableSelected === 0
                ? "Select leads that have a website and no email yet"
                : undefined
            }
          >
            <MailPlus />
            Find emails ({enrichableSelected})
          </Button>
          {initialSearchId && (
            <Button
              size="sm"
              variant="outline"
              disabled={job?.status === "RUNNING"}
              onClick={() => startEnrichment()}
              title="Enrich all matching leads missing emails"
            >
              Enrich all missing
            </Button>
          )}
        </div>
      </div>

      {filtersActive && (
        <button
          onClick={clearFilters}
          className="w-fit text-xs text-muted-foreground underline hover:text-foreground"
        >
          Clear all filters
        </button>
      )}

      <div
        role="group"
        aria-label="Filter by status"
        className="flex flex-wrap items-center gap-1.5"
      >
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          const count = statusChipCount(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              aria-pressed={active}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-all duration-300 ease-fluid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
                active
                  ? "border-transparent bg-primary text-primary-foreground shadow-xs"
                  : "border-border bg-card text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
              )}
            >
              {opt.label}
              {count !== null && (
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    active ? "text-primary-foreground/75" : "text-muted-foreground/60"
                  )}
                >
                  {count.toLocaleString()}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {job && <EnrichmentTaskRows job={job} />}

      {actionError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="hidden overflow-x-auto rounded-lg border border-border bg-card sm:block">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={toggleAll}
                  aria-label="Select all on page"
                  className="size-4 cursor-pointer accent-[var(--primary)]"
                />
              </th>
              <th className="px-3 py-2.5 font-medium">Business</th>
              <th className="px-3 py-2.5 font-medium">Phone</th>
              <th className="px-3 py-2.5 font-medium">Email</th>
              <th className="px-3 py-2.5 font-medium">Website</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="w-20 px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                  No leads found. Run a{" "}
                  <a href="/search" className="text-primary underline">
                    new search
                  </a>{" "}
                  or <button onClick={() => setShowImport(true)} className="text-primary underline">import a CSV</button>.
                </td>
              </tr>
            )}
            {loading &&
              [0, 1, 2, 3, 4].map((i) => (
                <tr key={`skeleton-${i}`} className="border-b border-border/60 last:border-0" aria-hidden>
                  <td className="px-3 py-2.5"><div className="size-4 animate-pulse rounded bg-muted" /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="size-7 shrink-0 animate-pulse rounded-md bg-muted" />
                      <div>
                        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                        <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-muted" />
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><div className="h-4 w-28 animate-pulse rounded bg-muted" /></td>
                  <td className="px-3 py-2.5"><div className="h-4 w-36 animate-pulse rounded bg-muted" /></td>
                  <td className="px-3 py-2.5"><div className="h-4 w-32 animate-pulse rounded bg-muted" /></td>
                  <td className="px-3 py-2.5"><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></td>
                  <td className="px-3 py-2.5"><div className="size-8 animate-pulse rounded-md bg-muted" /></td>
                </tr>
              ))}
            {rows.map((lead) => (
              <tr
                key={lead.id}
                className={cn(
                  "border-b border-border/60 last:border-0 transition-colors duration-200 ease-fluid",
                  selected.has(lead.id) ? "bg-accent/30" : "hover:bg-secondary/30"
                )}
              >
                <td className="px-3 py-2.5 align-top">
                  <input
                    type="checkbox"
                    checked={selected.has(lead.id)}
                    onChange={() => toggleOne(lead.id)}
                    aria-label={`Select ${lead.name}`}
                    className="mt-0.5 size-4 cursor-pointer accent-[var(--primary)]"
                  />
                </td>
                <td className="max-w-xs px-3 py-2.5">
                  <div className="flex items-start gap-2.5">
                    <span
                      aria-hidden
                      className="mt-px flex size-7 shrink-0 items-center justify-center rounded-md bg-accent text-sm font-semibold text-accent-foreground"
                    >
                      {(lead.name.trim()[0] ?? "?").toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="block truncate font-medium hover:text-primary hover:underline"
                      >
                        {lead.name}
                      </Link>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                        <FollowUpControl
                          value={lead.followUpAt}
                          variant="compact"
                          onSave={(value) => changeFollowUp(lead.id, value)}
                        />
                        {lead.category && (
                          <span className="shrink-0 rounded-full border border-border bg-secondary/70 px-1.5 py-px text-[11px] leading-4">
                            {categoryLabel(lead.category)}
                          </span>
                        )}
                        <span className="truncate">{lead.address}</span>
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 align-top">
                  {lead.phoneE164 ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3 text-success" />
                      {lead.phoneE164}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="max-w-52 px-3 py-2.5 align-top">
                  {lead.email ? (
                    <a
                      href={`mailto:${lead.email}`}
                      title={lead.email}
                      className="inline-flex max-w-full items-center gap-1 hover:underline"
                    >
                      <Mail className="size-3 shrink-0 text-muted-foreground" />
                      <span className="truncate">{lead.email}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground/50">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top">
                  {lead.website ? (
                    <a
                      href={lead.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <Globe className="size-3" />
                      Visit
                    </a>
                  ) : (
                    <span className="rounded bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-warning">
                      No website
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 align-top">
                  <StatusSelect lead={lead} onChange={(status) => changeStatus(lead.id, status)} />
                </td>
                <td className="px-3 py-2.5 text-right align-top whitespace-nowrap">
                  {lead.phoneE164 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Message on WhatsApp"
                      className="text-[#25D366]"
                      onClick={() =>
                        setMessageTarget({
                          id: lead.id,
                          name: lead.name,
                          category: lead.category,
                          phoneE164: lead.phoneE164 as string,
                        })
                      }
                    >
                      <MessageCircle />
                    </Button>
                  )}
                  {lead.website && !lead.email && (
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Find public email"
                      onClick={() => startEnrichment([lead.id])}
                      disabled={job?.status === "RUNNING"}
                    >
                      <MailPlus className="!size-3.5" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!loading && rows.length === 0 && (
        <div className="rounded-lg border border-border bg-card px-4 py-16 text-center text-muted-foreground sm:hidden">
          No leads found. Run a{" "}
          <a href="/search" className="text-primary underline">
            new search
          </a>{" "}
          or <button onClick={() => setShowImport(true)} className="text-primary underline">import a CSV</button>.
        </div>
      )}

      {loading && (
        <ul className="flex flex-col gap-2 sm:hidden" aria-hidden>
          {[0, 1, 2].map((i) => (
            <li key={i} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="size-9 shrink-0 animate-pulse rounded-md bg-muted" />
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-36 animate-pulse rounded bg-muted" />
                  <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
              <div className="mt-3 h-3 w-48 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <ul className="flex flex-col gap-2 sm:hidden">
          {rows.map((lead) => (
            <li
              key={lead.id}
              className={cn(
                "rounded-lg border bg-card p-4 transition-colors duration-200 ease-fluid",
                selected.has(lead.id) ? "border-primary/40 bg-accent/30" : "border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selected.has(lead.id)}
                  onChange={() => toggleOne(lead.id)}
                  aria-label={`Select ${lead.name}`}
                  className="mt-2 size-5 cursor-pointer accent-[var(--primary)]"
                />
                <span
                  aria-hidden
                  className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-base font-semibold text-accent-foreground"
                >
                  {(lead.name.trim()[0] ?? "?").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/leads/${lead.id}`}
                    className="block truncate text-sm font-medium hover:text-primary hover:underline"
                  >
                    {lead.name}
                  </Link>
                  <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-muted-foreground">
                    {lead.category && (
                      <span className="shrink-0 rounded-full border border-border bg-secondary/70 px-1.5 py-px text-[11px] leading-4">
                        {categoryLabel(lead.category)}
                      </span>
                    )}
                    {lead.followUpAt && (
                      <CalendarClock className="size-3 shrink-0 text-warning" aria-label="Follow-up set" />
                    )}
                    {lead.address && <span className="w-full truncate">{lead.address}</span>}
                  </span>
                </div>
                <div className="shrink-0 pt-0.5">
                  <StatusSelect lead={lead} onChange={(status) => changeStatus(lead.id, status)} />
                </div>
              </div>

              <div className="mt-3 flex flex-col gap-1.5 border-t border-border/60 pt-3 text-sm">
                {lead.phoneE164 && (
                  <a href={`tel:${lead.phoneE164}`} className="inline-flex w-fit items-center gap-2">
                    <Phone className="size-3.5 text-success" />
                    {lead.phoneE164}
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="inline-flex w-fit max-w-full items-center gap-2">
                    <Mail className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{lead.email}</span>
                  </a>
                )}
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex w-fit items-center gap-2 text-primary hover:underline"
                  >
                    <Globe className="size-3.5" />
                    Visit website
                  </a>
                ) : (
                  <span className="w-fit rounded bg-warning/15 px-1.5 py-0.5 text-xs font-medium text-warning">
                    No website
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
                <FollowUpControl
                  value={lead.followUpAt}
                  variant="labeled"
                  onSave={(value) => changeFollowUp(lead.id, value)}
                />
                {(lead.phoneE164 || (lead.website && !lead.email)) && (
                  <div className="flex flex-wrap items-center gap-2">
                    {lead.phoneE164 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[#25D366]"
                        onClick={() =>
                          setMessageTarget({
                            id: lead.id,
                            name: lead.name,
                            category: lead.category,
                            phoneE164: lead.phoneE164 as string,
                          })
                        }
                      >
                        <MessageCircle />
                        WhatsApp
                      </Button>
                    )}
                    {lead.website && !lead.email && (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={job?.status === "RUNNING"}
                        onClick={() => startEnrichment([lead.id])}
                      >
                        <MailPlus className="!size-3.5" />
                        Find email
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {messageTarget && (
        <WhatsAppModal
          lead={messageTarget}
          templates={templates}
          senderName={senderName}
          onClose={() => setMessageTarget(null)}
          onContacted={(leadId) => {
            setData((prev) =>
              prev
                ? {
                    ...prev,
                    leads: prev.leads.map((lead) =>
                      lead.id === leadId ? { ...lead, status: "CONTACTED" } : lead
                    ),
                  }
                : prev
            );
          }}
        />
      )}

      {showImport && (
        <CsvImportModal
          hasSearchFilter={Boolean(initialSearchId)}
          onClose={() => setShowImport(false)}
          onImported={bumpDataVersion}
        />
      )}

      {data && data.pages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft /> Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= data.pages || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function isoDatePart(value: string): string | null {
  return /^(\d{4}-\d{2}-\d{2})/.exec(value)?.[1] ?? null;
}

function fmtFollowUp(value: string): string {
  const part = isoDatePart(value);
  if (!part) return value;
  const month = Number(part.slice(5, 7));
  return `${MONTHS_SHORT[month - 1] ?? ""} ${Number(part.slice(8, 10))}`;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
}

function FollowUpControl({
  value,
  variant,
  onSave,
}: {
  value?: string | null;
  variant: "compact" | "labeled";
  onSave: (date: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const datePart = value ? isoDatePart(value) : null;
  const overdue = datePart !== null && datePart < todayIso();

  if (editing) {
    return (
      <input
        type="date"
        autoFocus
        defaultValue={datePart ?? ""}
        aria-label="Follow-up date"
        onChange={(e) => {
          onSave(e.target.value || null);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") setEditing(false);
        }}
        onBlur={(e) => {
          if (!e.target.value) setEditing(false);
        }}
        className="h-7 rounded-md border border-input bg-card px-1.5 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5">
      <button
        type="button"
        onClick={() => setEditing(true)}
        title={
          datePart
            ? `Follow-up ${fmtFollowUp(value as string)} — click to change`
            : "Set a follow-up reminder"
        }
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1 py-0.5 text-xs transition-colors duration-300 ease-fluid hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          datePart
            ? overdue
              ? "font-medium text-warning"
              : "text-warning/90"
            : "text-muted-foreground/60 hover:text-foreground"
        )}
      >
        <CalendarClock className="size-3 shrink-0" />
        {datePart ? (
          <span className="tabular-nums">{fmtFollowUp(value as string)}</span>
        ) : (
          variant === "labeled" && <span>Add reminder</span>
        )}
      </button>
      {datePart && (
        <button
          type="button"
          onClick={() => onSave(null)}
          title="Clear reminder"
          aria-label={`Clear follow-up for ${fmtFollowUp(value as string)}`}
          className="flex size-5 items-center justify-center rounded text-muted-foreground/50 transition-colors duration-300 ease-fluid hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
        >
          <X className="size-3" />
        </button>
      )}
    </span>
  );
}

function StatusSelect({
  lead,
  onChange,
}: {
  lead: LeadRow;
  onChange: (status: string) => void;
}) {
  return (
    <select
      value={lead.status}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Status for ${lead.name}`}
      className={`cursor-pointer appearance-none rounded-full border-0 px-2 py-1 text-xs font-medium ${
        lead.status === "NEW"
          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
          : lead.status === "CONTACTED"
            ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
            : lead.status === "REPLIED"
              ? "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300"
              : lead.status === "WON"
                ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
      }`}
    >
      <option value="NEW">New</option>
      <option value="CONTACTED">Contacted</option>
      <option value="REPLIED">Replied</option>
      <option value="WON">Won</option>
      <option value="LOST">Lost</option>
    </select>
  );
}

function useDebounce<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
