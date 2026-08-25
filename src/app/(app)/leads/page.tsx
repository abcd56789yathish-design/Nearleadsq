import { Layers, MapPin, Search, Users } from "lucide-react";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { LeadsTable } from "@/components/leads-table";
import { MapPreview } from "@/components/map-preview";
import { ToolChips, type ToolChipItem } from "@/components/tool-chips";
import { categoryLabel } from "@/lib/categories";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ searchId?: string; followUp?: string }>;
}) {
  const { searchId, followUp } = await searchParams;
  const ctx = await requireWorkspace();

  let chips: ToolChipItem[] = [];
  let mapSearch: { lat: number; lng: number; radiusKm: number } | null = null;
  let templates: { id: string; name: string; body: string }[] = [];
  if (ctx) {
    const foundTemplates = await db.template.findMany({
      where: { userId: ctx.userId, workspaceId: ctx.workspace.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
    templates = foundTemplates.map((t) => ({ id: t.id, name: t.name, body: t.body }));

    if (searchId) {
      const search = await db.search.findFirst({
        where: { id: searchId, userId: ctx.userId, workspaceId: ctx.workspace.id },
      });
      if (search) {
        const count = await db.lead.count({ where: { searchId: search.id } });
        chips = [
          { icon: Search, label: `"${search.query}"` },
          { icon: Layers, label: categoryLabel(search.category) },
          { icon: MapPin, label: `${search.radiusKm} km radius` },
          { icon: Users, label: `${count.toLocaleString()} leads` },
        ];
        mapSearch = { lat: search.lat, lng: search.lng, radiusKm: search.radiusKm };
      }
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
        <ToolChips items={chips} />
        {!chips.length && (
          <a
            href="/search"
            className="text-sm font-medium text-primary hover:underline"
          >
            Run a new search →
          </a>
        )}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <LeadsTable
          initialSearchId={searchId}
          initialFollowUp={followUp}
          templates={templates.map((t) => ({ id: t.id, name: t.name, body: t.body }))}
          senderName={ctx?.userName ?? null}
        />
        {mapSearch && (
          <div className="h-fit lg:sticky lg:top-8">
            <MapPreview {...mapSearch} />
          </div>
        )}
      </div>
    </div>
  );
}
