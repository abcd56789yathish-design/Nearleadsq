import type { CategoryDef } from "./categories";

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

export const MAX_LEADS_PER_SEARCH = 500;

export interface Poi {
  osmType: string;
  osmId: string;
  name: string;
  subcategory: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  address: string | null;
  openingHours: string | null;
  lat: number | null;
  lng: number | null;
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildQuery(
  def: CategoryDef,
  lat: number,
  lng: number,
  radiusKm: number
): string {
  const radiusM = Math.round(radiusKm * 1000);
  const clauses: string[] = [];
  for (const [key, values] of Object.entries(def.tags)) {
    if (!values.length) continue;
    const regex = `^(${values.join("|")})$`;
    clauses.push(`node["${key}"~"${regex}"](around:${radiusM},${lat},${lng});`);
    clauses.push(`way["${key}"~"${regex}"](around:${radiusM},${lat},${lng});`);
  }
  return `[out:json][timeout:30];(${clauses.join("")});out center tags;`;
}

function firstTag(tags: Record<string, string>, keys: string[]): string | null {
  for (const key of keys) {
    const value = tags[key];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

function buildAddress(tags: Record<string, string>): string | null {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:city"] ?? tags["addr:town"] ?? tags["addr:village"],
    tags["addr:postcode"],
  ].filter((part) => part && part.trim());
  return parts.length ? parts.join(", ") : null;
}

function parseElements(elements: OverpassElement[], def: CategoryDef): Poi[] {
  const seen = new Set<string>();
  const pois: Poi[] = [];

  for (const el of elements) {
    const tags = el.tags ?? {};
    const name = tags.name?.trim();
    if (!name) continue;

    const key = `${el.type}/${el.id}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const lat = el.lat ?? el.center?.lat ?? null;
    const lng = el.lon ?? el.center?.lon ?? null;

    pois.push({
      osmType: el.type,
      osmId: String(el.id),
      name,
      subcategory: def.label,
      phone: firstTag(tags, ["phone", "contact:phone", "contact:mobile"]),
      website: firstTag(tags, ["website", "contact:website", "url"]),
      email: firstTag(tags, ["email", "contact:email"]),
      address: buildAddress(tags),
      openingHours: tags.opening_hours?.trim() || null,
      lat,
      lng,
    });
    if (pois.length >= MAX_LEADS_PER_SEARCH) break;
  }

  return pois;
}

async function fetchOverpass(endpoint: string, query: string): Promise<OverpassElement[]> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "NearLeadsQ/0.1 (lead-gen SaaS demo)",
    },
    body: `data=${encodeURIComponent(query)}`,
    signal: AbortSignal.timeout(45_000),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Overpass responded ${res.status}`);
  }
  const data = (await res.json()) as { elements?: OverpassElement[] };
  return data.elements ?? [];
}

export async function searchBusinesses(options: {
  def: CategoryDef;
  lat: number;
  lng: number;
  radiusKm: number;
}): Promise<Poi[]> {
  const query = buildQuery(options.def, options.lat, options.lng, options.radiusKm);
  let lastError: unknown;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const elements = await fetchOverpass(endpoint, query);
        return parseElements(elements, options.def);
      } catch (error) {
        lastError = error;
        await new Promise((resolve) => setTimeout(resolve, attempt === 0 ? 1500 : 0));
      }
    }
  }

  throw new Error(
    lastError instanceof Error
      ? `Business search failed: ${lastError.message}`
      : "Business search failed"
  );
}
