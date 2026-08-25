import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Globe,
  Mail,
  MapPin,
  MailPlus,
  Phone,
  Plus,
  StickyNote,
} from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActiveWorkspace } from "@/lib/workspace";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadDetailPanel } from "@/components/lead-detail-panel";

const ACTIVITY_ICONS: Record<string, typeof ArrowRight> = {
  STATUS: ArrowRight,
  NOTE: StickyNote,
  FOLLOWUP: CalendarClock,
  EMAIL_FOUND: MailPlus,
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) notFound();
  const workspace = await getActiveWorkspace(session.user.id);

  const lead = await db.lead.findFirst({
    where: { id, userId: session.user.id, workspaceId: workspace.id },
    include: {
      search: { select: { id: true, query: true } },
      activities: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 50,
      },
    },
  });
  if (!lead) notFound();

  const templates = await db.template.findMany({
    where: { userId: session.user.id, workspaceId: workspace.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  const isImported = lead.osmId.startsWith("csv-");
  const details = [
    lead.phoneE164 && {
      icon: Phone,
      content: (
        <a href={`tel:${lead.phoneE164}`} className="hover:underline">
          {lead.phoneE164}
        </a>
      ),
    },
    lead.email && {
      icon: Mail,
      content: (
        <a href={`mailto:${lead.email}`} className="hover:underline">
          {lead.email}
        </a>
      ),
    },
    lead.website && {
      icon: Globe,
      content: (
        <a
          href={lead.website}
          target="_blank"
          rel="noreferrer"
          className="text-primary hover:underline"
        >
          {lead.website.replace(/^https?:\/\//, "")}
        </a>
      ),
    },
    lead.address && { icon: MapPin, content: <span>{lead.address}</span> },
    lead.openingHours && { icon: CalendarClock, content: <span>{lead.openingHours}</span> },
  ].filter(Boolean) as { icon: typeof MapPin; content: React.ReactNode }[];

  return (
    <div>
      <Link
        href={lead.searchId ? `/leads?searchId=${lead.searchId}` : "/leads"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to leads
      </Link>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{lead.name}</h1>
        {lead.category && <Badge>{lead.category}</Badge>}
        {isImported ? (
          <Badge className="bg-secondary text-secondary-foreground">Imported</Badge>
        ) : (
          lead.osmId && (
            <a
              href={`https://www.openstreetmap.org/${lead.osmType}/${lead.osmId}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-muted-foreground underline hover:text-foreground"
            >
              View on OpenStreetMap
            </a>
          )
        )}
      </div>
      {!isImported && lead.search && (
        <p className="mt-1 text-sm text-muted-foreground">
          From search{" "}
          <Link
            href={`/leads?searchId=${lead.search.id}`}
            className="underline hover:text-foreground"
          >
            “{lead.search.query}”
          </Link>
        </p>
      )}

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contact details</CardTitle>
            </CardHeader>
            <CardContent>
              {details.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No contact information yet. Run a search to find this business
                  on OpenStreetMap or import a CSV with its details.
                </p>
              ) : (
                <ul className="flex flex-col gap-2.5 text-sm">
                  {details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <detail.icon className="size-4 shrink-0 text-muted-foreground" />
                      {detail.content}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <LeadDetailPanel
                lead={{
                  id: lead.id,
                  name: lead.name,
                  category: lead.category,
                  phoneE164: lead.phoneE164,
                  status: lead.status,
                  notes: lead.notes,
                  followUpAt: lead.followUpAt ? lead.followUpAt.toISOString() : null,
                }}
                templates={templates.map((t) => ({
                  id: t.id,
                  name: t.name,
                  body: t.body,
                }))}
                senderName={session.user.name ?? null}
              />
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit lg:sticky lg:top-8">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activity</CardTitle>
            <CardDescription>Status changes, notes & reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col">
              {[...lead.activities].reverse().map((activity) => {
                const Icon = ACTIVITY_ICONS[activity.type] ?? ArrowRight;
                return (
                  <li key={activity.id} className="flex gap-3 pb-4 last:pb-0">
                    <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-secondary">
                      <Icon className="size-3 text-muted-foreground" />
                    </span>
                    <span className="min-w-0 text-sm">
                      <span className="block break-words">{activity.detail}</span>
                      <span className="block text-xs text-muted-foreground">
                        {new Date(activity.createdAt).toLocaleString()}
                      </span>
                    </span>
                  </li>
                );
              })}
              <li className="flex gap-3 border-t border-border pt-4">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Plus className="size-3 text-primary" />
                </span>
                <span className="min-w-0 text-sm">
                  <span className="block">Lead added</span>
                  <span className="block text-xs text-muted-foreground">
                    {new Date(lead.createdAt).toLocaleString()}
                  </span>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
