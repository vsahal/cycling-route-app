import type { RouteResponse } from "../types.ts";
import "./RouteSummary.css";

const METERS_PER_MILE = 1609.344;
const KM_PER_MILE = 1.60934;

const toMiles = (meters: number) => (meters / METERS_PER_MILE).toFixed(1);
const toMph = (kmh: number) => (kmh / KM_PER_MILE).toFixed(0);

function buildGpx(routeData: RouteResponse): string {
  const coords =
    (routeData.route_geojson?.features?.[0]?.geometry as { coordinates?: number[][] } | null)
      ?.coordinates ?? [];
  const now = new Date().toISOString();

  const trkpts = coords
    .map(([lng, lat, ele]) => {
      const eleTag =
        ele != null ? `\n        <ele>${ele.toFixed(1)}</ele>` : "";
      return `      <trkpt lat="${lat}" lon="${lng}">${eleTag}\n      </trkpt>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Cycling Route Generator"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>Cycling Route</name>
    <time>${now}</time>
  </metadata>
  <trk>
    <name>Cycling Route</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`;
}

function downloadGpx(routeData: RouteResponse): void {
  const gpx = buildGpx(routeData);
  const blob = new Blob([gpx], { type: "application/gpx+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "cycling-route.gpx";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  routeData: RouteResponse | null;
  error: string | null;
}

export default function RouteSummary({ routeData, error }: Props) {
  if (error) {
    return (
      <div className="summary-card summary-card--error">
        <h3 className="summary-error-title">Error</h3>
        <p className="summary-text">{error}</p>
      </div>
    );
  }

  if (!routeData) {
    return (
      <div className="summary-card summary-card--empty">
        <p>Fill in your preferences and click Generate Route to get started.</p>
      </div>
    );
  }

  const { ai_summary, reasoning, conditions, route_geojson } = routeData;
  const summary = (route_geojson?.features?.[0]?.properties as Record<string, { distance?: number; duration?: number }> | null)?.summary;
  const distance = summary?.distance;
  const duration = summary?.duration;

  const w = conditions?.weather;
  const t = conditions?.traffic;

  return (
    <div className="summary-card">
      <h3 className="summary-heading">Route Summary</h3>

      <p className="summary-text">{ai_summary}</p>

      {(distance || duration) && (
        <div className="stats-row">
          {distance && (
            <div className="stat">
              <span className="stat-label">Distance</span>
              <span className="stat-value">{toMiles(distance)} mi</span>
            </div>
          )}
          {duration && (
            <div className="stat">
              <span className="stat-label">Est. Time</span>
              <span className="stat-value">
                {Math.round(duration / 60)} min
              </span>
            </div>
          )}
        </div>
      )}

      {reasoning && (
        <div className="summary-section">
          <h4 className="summary-subheading">AI Reasoning</h4>
          <p className="summary-text">{reasoning}</p>
        </div>
      )}

      <div className="summary-section">
        <button
          className="gpx-download-btn"
          onClick={() => downloadGpx(routeData)}
        >
          Download GPX
        </button>
      </div>
    </div>
  );
}
