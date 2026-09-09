import { NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/workspace";
import { db } from "@/lib/db";

export async function GET() {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searches = await db.search.findMany({
    where: { userId: ctx.userId, workspaceId: ctx.workspace.id },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { leads: true } },
      leads: {
        where: { userId: ctx.userId, workspaceId: ctx.workspace.id },
        select: { status: true },
      },
    },
  });

  const result = searches.map((search) => {
    const statusCounts: Record<string, number> = {};
    for (const lead of search.leads) {
      statusCounts[lead.status] = (statusCounts[lead.status] ?? 0) + 1;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { leads, ...rest } = search;
    return { ...rest, statusCounts };
  });

  return NextResponse.json({ searches: result });
}
