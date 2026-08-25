import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = new URL(request.url).searchParams;
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const pageSize = Math.min(100, Math.max(10, Number(params.get("pageSize") ?? 25)));
  const searchId = params.get("searchId") || null;
  const status = params.get("status");
  const q = params.get("q")?.trim();
  const hasWebsite = params.get("hasWebsite");
  const hasPhone = params.get("hasPhone");
  const hasEmail = params.get("hasEmail");
  const followUp = params.get("followUp");

  const where: Prisma.LeadWhereInput = {
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
  }

  const [total, leads, statusGroups] = await Promise.all([
    db.lead.count({ where }),
    db.lead.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    // Counts per status ignore the status filter itself so the filter
    // chips keep stable totals while one is active.
    db.lead.groupBy({
      by: ["status"],
      where: { ...where, status: undefined },
      _count: { _all: true },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const group of statusGroups) {
    statusCounts[group.status] = group._count._all;
  }

  return NextResponse.json({
    total,
    page,
    pageSize,
    pages: Math.max(1, Math.ceil(total / pageSize)),
    leads,
    statusCounts,
  });
}
