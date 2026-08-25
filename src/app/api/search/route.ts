import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";
import { QUOTA_MESSAGES, getLeadQuota } from "@/lib/plans";
import { geocode } from "@/lib/geocode";
import { searchBusinesses } from "@/lib/overpass";
import { CATEGORIES } from "@/lib/categories";
import { toE164 } from "@/lib/phone";

const bodySchema = z.object({
  query: z.string().trim().min(2).max(200),
  category: z.string().refine((key) => key in CATEGORIES, "Unknown category"),
  radiusKm: z.number().int().min(1).max(50),
});

export async function POST(request: Request) {
  const ctx = await requireWorkspace();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const workspaceId = ctx.workspace.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { query, category, radiusKm } = parsed.data;
  const def = CATEGORIES[category];

  const quota = await getLeadQuota(ctx.userId);
  if (quota.blocked) {
    return NextResponse.json({ error: QUOTA_MESSAGES.leads }, { status: 402 });
  }

  try {
    const geo = await geocode(query);

    const pois = await searchBusinesses({
      def,
      lat: geo.lat,
      lng: geo.lng,
      radiusKm,
    });

    const search = await db.search.create({
      data: {
        userId: ctx.userId,
        workspaceId,
        query,
        lat: geo.lat,
        lng: geo.lng,
        countryCode: geo.countryCode,
        category,
        radiusKm,
      },
    });

    let limitReached = false;
    if (pois.length) {
      const existing = await db.lead.findMany({
        where: {
          userId: ctx.userId,
          workspaceId,
          osmId: { in: pois.map((poi) => poi.osmId) },
        },
        select: { osmId: true },
      });
      const seen = new Set(existing.map((row) => row.osmId));
      let fresh = pois.filter((poi) => !seen.has(poi.osmId));
      limitReached = fresh.length > quota.remaining;
      if (limitReached) fresh = fresh.slice(0, quota.remaining);

      if (fresh.length) {
        await db.lead.createMany({
          data: fresh.map((poi) => ({
            userId: ctx.userId,
            workspaceId,
            searchId: search.id,
            osmType: poi.osmType,
            osmId: poi.osmId,
            name: poi.name,
            category: poi.subcategory,
            address: poi.address,
            phone: poi.phone,
            phoneE164: toE164(poi.phone, geo.countryCode),
            website: poi.website,
            email: poi.email,
            openingHours: poi.openingHours,
            lat: poi.lat,
            lng: poi.lng,
          })),
        });
      }
    }

    return NextResponse.json({ searchId: search.id, count: pois.length, limitReached });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 502 }
    );
  }
}
