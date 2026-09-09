import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { inngest } from "@/inngest/client";

const bodySchema = z.object({
  leadIds: z.array(z.string()).min(1).max(500).optional(),
  searchId: z.string().optional(),
});

export async function POST(request: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success || (!parsed.data.leadIds && !parsed.data.searchId)) {
    return NextResponse.json(
      { error: "Provide leadIds or searchId" },
      { status: 400 }
    );
  }

  const where = {
    userId: ctx.userId,
    workspaceId: ctx.workspace.id,
    email: null,
    website: { not: null },
    ...(parsed.data.leadIds
      ? { id: { in: parsed.data.leadIds } }
      : { searchId: parsed.data.searchId as string }),
  };

  const leads = await db.lead.findMany({
    where,
    select: { id: true },
  });

  if (!leads.length) {
    return NextResponse.json(
      { error: "No eligible leads (they need a website and no known email)" },
      { status: 422 }
    );
  }

  const job = await db.enrichmentJob.create({
    data: {
      userId: ctx.userId,
      workspaceId: ctx.workspace.id,
      leadIds: JSON.stringify(leads.map((lead) => lead.id)),
      total: leads.length,
    },
  });

  await inngest.send({
    name: "enrich/run",
    data: { jobId: job.id },
  });

  return NextResponse.json({
    jobId: job.id,
    total: job.total,
    startedAt: job.createdAt.toISOString(),
  });
}
