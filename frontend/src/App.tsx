import { useState } from "react";
import MapView from "./components/MapView.tsx";
import RouteForm from "./components/RouteForm.tsx";
import RouteSummary from "./components/RouteSummary.tsx";
import type { RouteFormData, RouteResponse, SelectedLocation } from "./types.ts";
import "./App.css";

export default function App() {
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewCoords, setPreviewCoords] = useState<[number, number] | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation | null>(null);

  const handleSubmit = async (formData: RouteFormData) => {
    setLoading(true);
    setError(null);
    setRouteData(null);

    try {
      const response = await fetch("/api/generate-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to generate route");
      }

      const data: RouteResponse = await response.json();
      setRouteData(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <span className="app-header-logo">🚴</span>
        <span className="app-header-title">Cycling Route Generator</span>
        <span className="app-header-powered-by">powered by AI</span>
      </header>

      <main className="app-main">
        <aside className="app-sidebar">
          <RouteForm
            onSubmit={handleSubmit}
            onLocationSelect={(lat, lng) => setPreviewCoords([lat, lng])}
            loading={loading}
            selectedLocation={selectedLocation}
          />
          <RouteSummary routeData={routeData} error={error} />
        </aside>

        <div className="app-map-area">
          <MapView
            routeData={routeData}
            previewCoords={previewCoords}
            clickedCoords={selectedLocation ? [selectedLocation.lat, selectedLocation.lng] : null}
            onMapClick={(lat, lng, address) => {
              setSelectedLocation({ lat, lng, address });
              setPreviewCoords([lat, lng]);
            }}
          />
        </div>
      </main>
    </div>
  );
}
