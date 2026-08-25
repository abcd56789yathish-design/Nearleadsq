import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { QUOTA_MESSAGES, getLeadQuota } from "@/lib/plans";
import { mapHeaders, parseCsv, type LeadCsvField } from "@/lib/csv";
import { toE164 } from "@/lib/phone";

const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_ROWS = 5000;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: string | undefined): string {
  return (value ?? "").trim();
}

function normalizeWebsite(raw: string): string | null {
  if (!raw) return null;
  const withoutScheme = raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  if (!/^[\w-]+(\.[\w-]+)+/.test(withoutScheme)) return null;
  return `https://${withoutScheme}`;
}

function dedupeKey(parts: (string | null)[]): string {
  return createHash("sha1")
    .update(parts.map((p) => p ?? "").join("|"))
    .digest("hex")
    .slice(0, 20);
}

export async function POST(request: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = ctx.userId;
  const workspaceId = ctx.workspace.id;

  const quota = await getLeadQuota(userId);
  if (quota.blocked) {
    return NextResponse.json({ error: QUOTA_MESSAGES.leads }, { status: 402 });
  }

  let csvText: string | null = null;
  let country: string | null = null;

  const contentType = request.headers.get("content-type") ?? "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      country = clean(form.get("country")?.toString() ?? "") || null;
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }
      if (file.size > MAX_FILE_BYTES) {
        return NextResponse.json(
          { error: "File is too large — the limit is 2 MB (~5000 rows)" },
          { status: 413 }
        );
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = typeof body.csv === "string" ? body.csv : null;
      country = clean(body.country ?? "") || null;
    }
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!csvText || !csvText.trim()) {
    return NextResponse.json({ error: "The uploaded file is empty" }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json(
      { error: "CSV needs a header row plus at least one lead row" },
      { status: 400 }
    );
  }

  const mapping = mapHeaders(rows[0]);
  const nameIdx = mapping.indexOf("name");
  if (nameIdx === -1) {
    return NextResponse.json(
      {
        error:
          'Could not find a "Name" column. Rename one column to "Name" (or "Business") and try again.',
      },
      { status: 422 }
    );
  }

  const dataRows = rows.slice(1);
  if (dataRows.length > MAX_ROWS) {
    return NextResponse.json(
      { error: `Too many rows — the limit is ${MAX_ROWS.toLocaleString()} per import` },
      { status: 413 }
    );
  }

  function cell(row: string[], field: LeadCsvField): string {
    const idx = mapping.indexOf(field);
    return idx === -1 ? "" : clean(row[idx]);
  }

  let invalid = 0;
  const seenKeys = new Set<string>();
  const records: Prisma.LeadCreateManyInput[] = [];

  for (const row of dataRows) {
    const name = cell(row, "name");
    if (!name) {
      invalid++;
      continue;
    }

    const rawPhone = cell(row, "phone");
    const phoneE164 = toE164(rawPhone, country);
    const emailRaw = cell(row, "email").toLowerCase();
    const email = EMAIL_RE.test(emailRaw) ? emailRaw : null;
    const website = normalizeWebsite(cell(row, "website"));
    const addressParts = [cell(row, "address"), cell(row, "city")].filter(Boolean);
    const address = addressParts.length > 0 ? addressParts.join(", ") : null;
    const category = cell(row, "category");
    const notes = cell(row, "notes");

    const osmId = `csv-${dedupeKey([
      name.toLowerCase(),
      phoneE164,
      email,
      website,
      address,
    ])}`;

    if (seenKeys.has(osmId)) {
      // Duplicate row within the same file — counted under "duplicates".
      continue;
    }
    seenKeys.add(osmId);

    records.push({
      userId,
      workspaceId,
      osmId,
      name,
      category: category || null,
      address,
      phone: rawPhone || null,
      phoneE164,
      website,
      email,
      emailSource: email ? "csv" : null,
      status: "NEW",
      notes: notes || null,
    });
  }

  const existing = await db.lead.findMany({
    where: { userId, workspaceId, osmId: { in: records.map((r) => r.osmId as string) } },
    select: { osmId: true },
  });
  const existingIds = new Set(existing.map((lead) => lead.osmId));
  const fresh = records.filter((record) => !existingIds.has(record.osmId as string));

  let skippedByLimit = 0;
  if (fresh.length > quota.remaining) {
    skippedByLimit = fresh.length - quota.remaining;
    fresh.length = quota.remaining;
  }

  if (fresh.length > 0) {
    await db.lead.createMany({ data: fresh });
  }

  return NextResponse.json({
    imported: fresh.length,
    duplicates: dataRows.length - invalid - fresh.length - skippedByLimit,
    invalid,
    ...(skippedByLimit > 0 ? { limitReached: true, skippedByLimit } : {}),
  });
}
