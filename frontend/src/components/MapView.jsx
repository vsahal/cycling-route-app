import L from "leaflet";
import "leaflet-polylinedecorator";
import "leaflet/dist/leaflet.css";
import { useEffect, useState } from "react";
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  TileLayer,
  useMap,
} from "react-leaflet";
import "./MapView.css";
import WeatherOverlay from "./WeatherOverlay.jsx";

function FlyToRoute({ center, geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;
    const coords = geojson.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length === 0) return;

    const lats = coords.map((c) => c[1]);
    const lngs = coords.map((c) => c[0]);
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [geojson, map]);

  return null;
}

function RouteArrows({ geojson }) {
  const map = useMap();

  useEffect(() => {
    if (!geojson) return;
    const coords = geojson.features?.[0]?.geometry?.coordinates;
    if (!coords || coords.length === 0) return;

    const latLngs = coords.map((c) => [c[1], c[0]]);
    const polyline = L.polyline(latLngs);
    const decorator = L.polylineDecorator(polyline, {
      patterns: [
        {
          offset: "10%",
          repeat: "12%",
          symbol: L.Symbol.arrowHead({
            pixelSize: 10,
            pathOptions: { color: "#2d6a4f", fillOpacity: 1, weight: 0 },
          }),
        },
      ],
    }).addTo(map);

    return () => map.removeLayer(decorator);
  }, [geojson, map]);

  return null;
}

const AUSTIN = [30.2672, -97.7431];

const WMO_DESCRIPTIONS = {
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

async function fetchWeatherForCoords(lat, lng) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lng,
    current:
      "temperature_2m,wind_speed_10m,wind_direction_10m,precipitation,weathercode,uv_index,relative_humidity_2m",
    wind_speed_unit: "kmh",
    forecast_days: 1,
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
    description: WMO_DESCRIPTIONS[c.weathercode] ?? "Unknown",
  };
}

export default function MapView({ routeData, previewCoords }) {
  const [defaultCenter, setDefaultCenter] = useState(AUSTIN);
  const [ambientWeather, setAmbientWeather] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setDefaultCenter([pos.coords.latitude, pos.coords.longitude]),
      () => setDefaultCenter(AUSTIN),
    );
  }, []);

  const activeCenter =
    routeData?.start_coords ?? previewCoords ?? defaultCenter;

  useEffect(() => {
    if (routeData?.conditions?.weather) return;
    fetchWeatherForCoords(activeCenter[0], activeCenter[1])
      .then(setAmbientWeather)
      .catch(() => {});
  }, [activeCenter, routeData]);

  const center = activeCenter;
  const weather = routeData?.conditions?.weather ?? ambientWeather;
  const traffic = routeData?.conditions?.traffic ?? null;

  const routeStyle = { color: "#2d6a4f", weight: 5, opacity: 0.85 };

  return (
    <div className="map-container">
      <WeatherOverlay weather={weather} traffic={traffic} />
      <MapContainer
        key={center.join(",")}
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {routeData?.route_geojson && (
          <>
            <GeoJSON data={routeData.route_geojson} style={routeStyle} />
            <FlyToRoute center={center} geojson={routeData.route_geojson} />
            <RouteArrows geojson={routeData.route_geojson} />
          </>
        )}

        {routeData?.start_coords && (
          <CircleMarker
            center={[routeData.start_coords[0], routeData.start_coords[1]]}
            radius={10}
            pathOptions={{
              color: "#fff",
              fillColor: "#e63946",
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
