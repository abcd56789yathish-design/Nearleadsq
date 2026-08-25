import Link from "next/link";
import { ArrowRight, CalendarClock, Mail, MessageCircle, Users } from "lucide-react";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InsightCards, type InsightItem } from "@/components/insight-cards";
import { categoryLabel } from "@/lib/categories";

export default async function DashboardPage() {
  const ctx = await requireWorkspace();
  if (!ctx) redirect("/login");
  const { userId, workspace, userName } = ctx;
  const wsWhere = { userId, workspaceId: workspace.id };

  const now = new Date();
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const inAWeek = new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    totalLeads,
    withEmail,
    contacted,
    replied,
    followUpsDue,
    followUpsSoon,
    dueLeads,
    recentSearches,
  ] = await Promise.all([
    db.lead.count({ where: wsWhere }),
    db.lead.count({ where: { ...wsWhere, email: { not: null } } }),
    db.lead.count({ where: { ...wsWhere, status: "CONTACTED" } }),
    db.lead.count({ where: { ...wsWhere, status: "REPLIED" } }),
    db.lead.count({
      where: { ...wsWhere, followUpAt: { lte: endOfToday }, status: { notIn: ["WON", "LOST"] } },
    }),
    db.lead.count({
      where: {
        ...wsWhere,
        followUpAt: { gt: endOfToday, lte: inAWeek },
        status: { notIn: ["WON", "LOST"] },
      },
    }),
    db.lead.findMany({
      where: { ...wsWhere, followUpAt: { lte: endOfToday }, status: { notIn: ["WON", "LOST"] } },
      orderBy: [{ followUpAt: "asc" }],
      take: 4,
      select: { id: true, name: true, followUpAt: true },
    }),
    db.search.findMany({
      where: wsWhere,
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { _count: { select: { leads: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Leads", value: totalLeads, icon: Users },
    { label: "Emails Found", value: withEmail, icon: Mail },
    { label: "Contacted", value: contacted + replied, icon: MessageCircle },
    { label: "Replied", value: replied, icon: ArrowRight },
  ];

  const emailCoverage = totalLeads > 0 ? Math.round((withEmail / totalLeads) * 100) : 0;
  const outreach = contacted + replied;
  const replyRate = outreach > 0 ? Math.round((replied / outreach) * 100) : 0;
  const bestSearch = recentSearches.length
    ? recentSearches.reduce((a, b) => (b._count.leads > a._count.leads ? b : a))
    : null;

  const insights: InsightItem[] = [];
  if (totalLeads > 0 && withEmail > 0) {
    insights.push({
      id: "coverage",
      headline: `${emailCoverage}% of your leads have a public email address.`,
      meta: `${withEmail.toLocaleString()} of ${totalLeads.toLocaleString()} leads`,
    });
  }
  if (outreach > 0) {
    insights.push({
      id: "reply-rate",
      headline: `${replyRate}% of the leads you've messaged have replied.`,
      meta: `${replied.toLocaleString()} replies from ${outreach.toLocaleString()} contacted`,
    });
  }
  if (bestSearch && bestSearch._count.leads > 0) {
    insights.push({
      id: "best-search",
      headline: `"${bestSearch.query}" is your richest list so far.`,
      meta: `${bestSearch._count.leads.toLocaleString()} leads · ${relativeDays(
        new Date(bestSearch.createdAt)
      )}`,
    });
  }

  const spark = [...recentSearches]
    .reverse()
    .map((search) => ({ label: search.query, value: search._count.leads }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {workspace.name}
            {userName ? ` · Welcome back, ${userName.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Find local businesses, enrich them with emails, and reach out on WhatsApp.
          </p>
        </div>
        <Link
          href="/search"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
        >
          New search
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center justify-between">
                {stat.label}
                <stat.icon className="size-4 text-muted-foreground" />
              </CardDescription>
              <CardTitle className="text-3xl tabular-nums">{stat.value.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      {insights.length > 0 && (
        <div className="mt-6">
          <InsightCards items={insights} spark={spark} />
        </div>
      )}

      {(followUpsDue > 0 || followUpsSoon > 0) && (
        <Card
          className={`mt-6 border-l-4 ${
            followUpsDue > 0 ? "border-l-warning" : "border-l-primary"
          }`}
        >
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-warning/15">
              <CalendarClock className="size-5 text-warning" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {followUpsDue > 0
                  ? `${followUpsDue} follow-up${followUpsDue === 1 ? "" : "s"} due`
                  : `${followUpsSoon} follow-up${followUpsSoon === 1 ? "" : "s"} coming up this week`}
              </p>
              <p className="text-xs text-muted-foreground">
                {followUpsDue > 0
                  ? followUpsSoon > 0
                    ? `Plus ${followUpsSoon} more in the next 7 days.`
                    : "Don't let warm leads go cold."
                  : "You're on top of things."}
              </p>
            </div>
            <Link
              href={`/leads?followUp=${followUpsDue > 0 ? "due" : "week"}`}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow-xs hover:bg-primary/90"
            >
              Review
              <ArrowRight className="size-3.5" />
            </Link>
            {dueLeads.length > 0 && (
              <div className="flex w-full flex-wrap gap-1.5">
                {dueLeads.map((lead) => {
                  if (!lead.followUpAt) return null;
                  const due = new Date(lead.followUpAt);
                  const overdue = isOverdue(due);
                  return (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-xs font-medium transition-colors duration-300 ease-fluid hover:bg-secondary ${
                        overdue
                          ? "border-warning/40 bg-warning/10 text-warning"
                          : "border-border bg-secondary/50 text-muted-foreground"
                      }`}
                    >
                      <CalendarClock className="size-3 shrink-0" />
                      {lead.name} · {fmtShortDate(due)}
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Recent searches</CardTitle>
          <CardDescription>Your latest lead lists</CardDescription>
        </CardHeader>
        <CardContent>
          {recentSearches.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No searches yet —{" "}
              <Link href="/search" className="text-primary underline">
                run your first one
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recentSearches.map((search) => (
                <li key={search.id}>
                  <Link
                    href={`/leads?searchId=${search.id}`}
                    className="flex items-center justify-between gap-4 py-3 text-sm hover:text-accent-foreground"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {search.query}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {categoryLabel(search.category)} · {search.radiusKm} km ·{" "}
                        {relativeDays(new Date(search.createdAt))}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {search._count.leads} leads
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function fmtShortDate(date: Date): string {
  const iso = date.toISOString();
  const month = Number(iso.slice(5, 7));
  return `${MONTHS_SHORT[month - 1] ?? ""} ${Number(iso.slice(8, 10))}`;
}

function isOverdue(date: Date): boolean {
  return date.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10);
}

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
