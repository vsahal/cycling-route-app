const USER_AGENT = "CyclingRouteApp/1.0";

export interface LocationSuggestion {
  name: string;
  lat: number;
  lng: number;
}

export async function searchLocation(query: string): Promise<LocationSuggestion[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  const data = await res.json();
  return data.map((r: { display_name: string; lat: string; lon: string }) => ({
    name: r.display_name,
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
  }));
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "User-Agent": USER_AGENT } },
  );
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}
