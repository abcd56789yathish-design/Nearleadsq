import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";

const LEAD_STATUSES = ["NEW", "CONTACTED", "REPLIED", "WON", "LOST"] as const;

const patchSchema = z.object({
  status: z.enum(LEAD_STATUSES).optional(),
  notes: z.string().max(2000).nullable().optional(),
  followUpAt: z.string().nullable().optional(),
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const lead = await db.lead.findFirst({
    where: { id, userId: ctx.userId, workspaceId: ctx.workspace.id },
    include: {
      search: { select: { id: true, query: true } },
      activities: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: 100,
      },
    },
  });
  if (!lead) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ lead });
}

const STATUS_LABELS: Record<(typeof LEAD_STATUSES)[number], string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  REPLIED: "Replied",
  WON: "Won",
  LOST: "Lost",
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Verify ownership and load current values for activity diffing.
  const current = await db.lead.findFirst({
    where: { id, userId: ctx.userId, workspaceId: ctx.workspace.id },
    select: { id: true, status: true, notes: true, followUpAt: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { status, notes, followUpAt } = parsed.data;
  const data: {
    status?: string;
    notes?: string | null;
    followUpAt?: Date | null;
    contactedAt?: Date;
  } = {};
  if (status !== undefined) data.status = status;
  if (notes !== undefined) data.notes = notes;

  if (followUpAt !== undefined) {
    if (followUpAt === null || followUpAt === "") {
      data.followUpAt = null;
    } else {
      const date = new Date(followUpAt);
      if (Number.isNaN(date.getTime())) {
        return NextResponse.json({ error: "Invalid follow-up date" }, { status: 400 });
      }
      data.followUpAt = date;
    }
  }

  if (status === "CONTACTED") {
    data.contactedAt = new Date();
  }

  const activities: { type: string; detail: string }[] = [];
  if (status && status !== current.status) {
    activities.push({
      type: "STATUS",
      detail: `${STATUS_LABELS[current.status as keyof typeof STATUS_LABELS] ?? current.status} → ${
        STATUS_LABELS[status]
      }`,
    });
  }
  if (notes !== undefined && (notes ?? "") !== (current.notes ?? "")) {
    activities.push({ type: "NOTE", detail: notes?.trim() || "Notes cleared" });
  }
  if (data.followUpAt !== undefined) {
    const next = data.followUpAt ? data.followUpAt.toISOString() : null;
    const prev = current.followUpAt ? current.followUpAt.toISOString() : null;
    if (next !== prev) {
      activities.push({
        type: "FOLLOWUP",
        detail: data.followUpAt
          ? `Follow-up set for ${data.followUpAt.toLocaleDateString()}`
          : "Follow-up cleared",
      });
    }
  }

  const [lead] = await db.$transaction([
    db.lead.update({ where: { id }, data }),
    ...activities.map((activity) =>
      db.leadActivity.create({
        data: {
          userId: ctx.userId,
          leadId: id,
          type: activity.type,
          detail: activity.detail,
        },
      })
    ),
  ]);

  return NextResponse.json({ lead });
}
