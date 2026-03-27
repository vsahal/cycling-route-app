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
  useMapEvents,
} from "react-leaflet";
import { reverseGeocode } from "../api/geocoding.ts";
import { fetchWeather } from "../api/weather.ts";
import type { RouteResponse, WeatherConditions } from "../types.ts";
import "./MapView.css";
import WeatherOverlay from "./WeatherOverlay.tsx";

function FlyToRoute({ geojson }: { geojson: RouteResponse["route_geojson"] }) {
  const map = useMap();

  useEffect(() => {
    const coords = geojson.features?.[0]?.geometry as { coordinates?: number[][] } | null;
    if (!coords?.coordinates || coords.coordinates.length === 0) return;

    const lats = coords.coordinates.map((c) => c[1]);
    const lngs = coords.coordinates.map((c) => c[0]);
    const bounds: [[number, number], [number, number]] = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)],
    ];
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [geojson, map]);

  return null;
}

function RouteArrows({ geojson }: { geojson: RouteResponse["route_geojson"] }) {
  const map = useMap();

  useEffect(() => {
    const geom = geojson.features?.[0]?.geometry as { coordinates?: number[][] } | null;
    if (!geom?.coordinates || geom.coordinates.length === 0) return;

    const latLngs = geom.coordinates.map((c) => [c[1], c[0]] as [number, number]);
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

    return () => {
      map.removeLayer(decorator);
    };
  }, [geojson, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const address = await reverseGeocode(lat, lng);
        onMapClick(lat, lng, address);
      } catch {
        onMapClick(lat, lng, `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      }
    },
  });
  return null;
}

const AUSTIN: [number, number] = [30.2672, -97.7431];

interface Props {
  routeData: RouteResponse | null;
  previewCoords: [number, number] | null;
  onMapClick?: (lat: number, lng: number, address: string) => void;
  clickedCoords: [number, number] | null;
  darkMode?: boolean;
}

const TILES = {
  light: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
};

export default function MapView({ routeData, previewCoords, onMapClick, clickedCoords, darkMode = false }: Props) {
  const [defaultCenter, setDefaultCenter] = useState<[number, number]>(AUSTIN);
  const [ambientWeather, setAmbientWeather] = useState<WeatherConditions | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setDefaultCenter([pos.coords.latitude, pos.coords.longitude]),
      () => setDefaultCenter(AUSTIN),
    );
  }, []);

  const activeCenter: [number, number] =
    routeData?.start_coords ?? previewCoords ?? defaultCenter;

  useEffect(() => {
    if (routeData?.conditions?.weather) return;
    fetchWeather(activeCenter[0], activeCenter[1])
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
      {!routeData && (
        <div className="map-click-hint">Click the map to set a start location</div>
      )}
      <MapContainer
        key={center.join(",")}
        center={center}
        zoom={12}
        style={{ height: "100%", width: "100%", borderRadius: 12 }}
      >
        <TileLayer
          key={darkMode ? "dark" : "light"}
          attribution={darkMode ? TILES.dark.attribution : TILES.light.attribution}
          url={darkMode ? TILES.dark.url : TILES.light.url}
        />
        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {clickedCoords && !routeData?.start_coords && (
          <CircleMarker
            center={clickedCoords}
            radius={10}
            pathOptions={{
              color: "#fff",
              fillColor: "#e63946",
              fillOpacity: 1,
              weight: 2,
            }}
          />
        )}

        {routeData?.route_geojson && (
          <>
            <GeoJSON data={routeData.route_geojson} style={routeStyle} />
            <FlyToRoute geojson={routeData.route_geojson} />
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
