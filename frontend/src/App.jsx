import { useState } from "react";
import MapView from "./components/MapView.jsx";
import RouteForm from "./components/RouteForm.jsx";
import RouteSummary from "./components/RouteSummary.jsx";

export default function App() {
  const [routeData, setRouteData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    <div style={styles.app}>
      <header style={styles.header}>
        <span style={styles.logo}>🚴</span>
        <span style={styles.headerTitle}>Cycling Route Generator</span>
        <span style={styles.poweredBy}>powered by AI</span>
      </header>

      <main style={styles.main}>
        <aside style={styles.sidebar}>
          <RouteForm onSubmit={handleSubmit} loading={loading} />
          <RouteSummary routeData={routeData} error={error} />
        </aside>

        <div style={styles.mapArea}>
          <MapView routeData={routeData} />
        </div>
      </main>
    </div>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  },
  header: {
    background: "#2d6a4f",
    color: "#fff",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    fontSize: 24,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 700,
    flex: 1,
  },
  poweredBy: {
    fontSize: 12,
    opacity: 0.75,
    fontStyle: "italic",
  },
  main: {
    flex: 1,
    display: "flex",
    gap: 16,
    padding: 16,
    overflow: "hidden",
  },
  sidebar: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
    width: 320,
    flexShrink: 0,
    overflowY: "auto",
  },
  mapArea: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    minHeight: 500,
  },
};
