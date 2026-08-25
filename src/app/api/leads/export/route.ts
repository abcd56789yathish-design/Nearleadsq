import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";

function csvCell(value: unknown): string {
  const str = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(str)) return `"${str.replaceAll('"', '""')}"`;
  return str;
}

export async function GET(request: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return new Response("Unauthorized", { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const searchId = params.get("searchId") || null;
  const status = params.get("status");
  const q = params.get("q")?.trim();
  const hasWebsite = params.get("hasWebsite");
  const hasPhone = params.get("hasPhone");
  const hasEmail = params.get("hasEmail");
  const followUp = params.get("followUp");

  const where: Record<string, unknown> = {
    userId: ctx.userId,
    workspaceId: ctx.workspace.id,
  };
  if (searchId) where.searchId = searchId;
  if (status && status !== "all") where.status = status;
  if (q) where.name = { contains: q };
  if (hasWebsite === "yes") where.website = { not: null };
  if (hasWebsite === "no") where.website = null;
  if (hasPhone === "yes") where.phoneE164 = { not: null };
  if (hasPhone === "no") where.phoneE164 = null;
  if (hasEmail === "yes") where.email = { not: null };
  if (hasEmail === "no") where.email = null;
  if (followUp === "due" || followUp === "week") {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    where.followUpAt =
      followUp === "due"
        ? { lte: endOfToday }
        : { gt: endOfToday, lte: new Date(endOfToday.getTime() + 7 * 24 * 60 * 60 * 1000) };
    // Match the /leads list semantics: skip stale reminders on closed deals.
    if (!where.status) where.status = { notIn: ["WON", "LOST"] };
  }

  const leads = await db.lead.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 5000,
  });

  const header = [
    "Name",
    "Category",
    "Address",
    "Phone",
    "WhatsApp",
    "Email",
    "Website",
    "Status",
    "Opening Hours",
    "Notes",
  ];
  const rows = leads.map((lead) =>
    [
      lead.name,
      lead.category,
      lead.address,
      lead.phone,
      lead.phoneE164,
      lead.email,
      lead.website,
      lead.status,
      lead.openingHours,
      lead.notes,
    ]
      .map(csvCell)
      .join(",")
  );

  const csv = "\uFEFF" + [header.join(","), ...rows].join("\r\n");
  const filename = `nearleadsq-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
