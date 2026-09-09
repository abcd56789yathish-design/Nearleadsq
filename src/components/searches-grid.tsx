"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderSearch,
  ExternalLink,
  RefreshCw,
  Trash2,
  AlertTriangle,
  Users,
} from "lucide-react";
import { categoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SearchItem {
  id: string;
  query: string;
  category: string;
  radiusKm: number;
  maxLeads: number;
  createdAt: string;
  _count: { leads: number };
  statusCounts: Record<string, number>;
}

const STATUS_COLORS: Record<string, string> = {
  NEW: "bg-blue-500",
  CONTACTED: "bg-amber-500",
  REPLIED: "bg-violet-500",
  WON: "bg-green-500",
  LOST: "bg-zinc-400",
};

const STATUS_ORDER = ["NEW", "CONTACTED", "REPLIED", "WON", "LOST"];

function relativeDays(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? "" : "s"} ago`;
  const years = Math.max(1, Math.floor(days / 365));
  return `${years} year${years === 1 ? "" : "s"} ago`;
}

export function SearchesGrid() {
  const [searches, setSearches] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/searches")
      .then((r) => r.json())
      .then((data) => setSearches(data.searches ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/searches/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSearches((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      // silently fail
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-3">
              <div className="h-5 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-muted" />
                <div className="h-3 w-2/3 rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16 text-center">
        <FolderSearch className="size-10 text-muted-foreground/40" />
        <p className="mt-4 text-sm text-muted-foreground">
          No searches yet — run your first one to start building lead lists.
        </p>
        <Link href="/search">
          <Button className="mt-4" size="sm">
            New search
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {searches.map((search) => {
        const total = search._count.leads;
        const isDeleting = deleting === search.id;
        const isConfirming = confirmDelete === search.id;

        return (
          <Card key={search.id} className="relative flex flex-col transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="truncate text-base">{search.query}</CardTitle>
              <CardDescription className="flex items-center gap-2 text-xs">
                <span>{categoryLabel(search.category)}</span>
                <span className="text-border">·</span>
                <span>{search.radiusKm} km</span>
                <span className="text-border">·</span>
                <span>{relativeDays(new Date(search.createdAt))}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="size-3.5" />
                <span className="font-medium text-foreground">
                  {total.toLocaleString()} lead{total === 1 ? "" : "s"}
                </span>
                <span>found</span>
              </div>

              {total > 0 && (
                <div className="flex gap-1" title={STATUS_ORDER.map((s) => `${s}: ${search.statusCounts[s] ?? 0}`).join(", ")}>
                  {STATUS_ORDER.map((status) => {
                    const count = search.statusCounts[status] ?? 0;
                    if (count === 0) return null;
                    const pct = Math.max(8, Math.round((count / total) * 100));
                    return (
                      <div
                        key={status}
                        className={`h-1.5 rounded-full ${STATUS_COLORS[status]}`}
                        style={{ width: `${pct}%` }}
                        title={`${status}: ${count}`}
                      />
                    );
                  })}
                </div>
              )}

              <div className="mt-auto flex items-center gap-2 pt-1">
                <Link href={`/leads?searchId=${search.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    <ExternalLink />
                    View leads
                  </Button>
                </Link>
                <Link href={`/search?rerun=${search.id}`}>
                  <Button variant="ghost" size="sm" title="Re-run this search">
                    <RefreshCw />
                  </Button>
                </Link>
                {isConfirming ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="destructive"
                      size="sm"
                      pending={isDeleting}
                      onClick={() => handleDelete(search.id)}
                      title="Confirm delete"
                    >
                      <AlertTriangle />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDelete(null)}
                      title="Cancel"
                    >
                      ✕
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(search.id)}
                    title="Delete search"
                  >
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
