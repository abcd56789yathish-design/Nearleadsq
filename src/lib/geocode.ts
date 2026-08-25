const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
  countryCode: string | null;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
  address?: { country_code?: string };
}

export async function geocode(query: string): Promise<GeoResult> {
  const url = `${NOMINATIM_URL}?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: { "User-Agent": "NearLeadsQ/0.1 (lead-gen SaaS demo)" },
      signal: AbortSignal.timeout(10_000),
      cache: "no-store",
    });
  } catch {
    throw new Error("Location service is unreachable. Try again shortly.");
  }

  if (!res.ok) {
    throw new Error("Location lookup failed. Try a different query.");
  }

  const items = (await res.json()) as NominatimItem[];
  if (!items.length) {
    throw new Error(`No place found for "${query}". Try adding city/country.`);
  }

  const item = items[0];
  return {
    lat: Number.parseFloat(item.lat),
    lng: Number.parseFloat(item.lon),
    displayName: item.display_name,
    countryCode: item.address?.country_code?.toUpperCase() ?? null,
  };
}
