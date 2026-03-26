import type { WeatherConditions } from "../types.ts";

const WMO_DESCRIPTIONS: Record<number, string> = {
  0: "Clear sky",
  1: "Partly cloudy",
  2: "Partly cloudy",
  3: "Partly cloudy",
  45: "Foggy",
  48: "Foggy",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Rain",
  63: "Rain",
  65: "Rain",
  71: "Snow",
  73: "Snow",
  75: "Snow",
  80: "Rain showers",
  81: "Rain showers",
  82: "Rain showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm",
};

export async function fetchWeather(lat: number, lng: number): Promise<WeatherConditions> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current:
      "temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weathercode,uv_index,relative_humidity_2m",
    wind_speed_unit: "kmh",
    forecast_days: "1",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  const data = await res.json();
  const c = data.current;
  return {
    temperature_c: c.temperature_2m,
    wind_speed_kmh: c.wind_speed_10m,
    wind_direction_deg: c.wind_direction_10m,
    precipitation_mm: c.precipitation,
    uv_index: c.uv_index,
    humidity_pct: c.relative_humidity_2m,
    description: WMO_DESCRIPTIONS[c.weathercode as number] ?? "Unknown",
  };
}
