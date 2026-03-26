import { useState } from "react";
import MapView from "./components/MapView.jsx";
import RouteForm from "./components/RouteForm.jsx";
import RouteSummary from "./components/RouteSummary.jsx";
import "./App.css";

export default function App() {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewCoords, setPreviewCoords] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleSubmit = async (formData) => {
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

      const data = await response.json();
      setRouteData(data);
    } catch (e) {
      setError(e.message);
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
