export function MapPreview({
  lat,
  lng,
  radiusKm,
}: {
  lat: number;
  lng: number;
  radiusKm: number;
}) {
  const latDeg = radiusKm / 111.32;
  const lngDeg = latDeg / Math.max(0.2, Math.cos((lat * Math.PI) / 180));
  const pad = 1.15;

  const bbox = [
    lng - lngDeg * pad,
    lat - latDeg * pad,
    lng + lngDeg * pad,
    lat + latDeg * pad,
  ].map((n) => n.toFixed(5));

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox.join(
    ","
  )}&layer=mapnik&marker=${lat.toFixed(5)},${lng.toFixed(5)}`;

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <iframe
        title="Search area map"
        src={src}
        className="h-56 w-full border-0"
        loading="lazy"
      />
    </div>
  );
}
