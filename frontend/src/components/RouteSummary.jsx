import './RouteSummary.css'

const METERS_PER_MILE = 1609.344
const KM_PER_MILE = 1.60934

const toMiles = (meters) => (meters / METERS_PER_MILE).toFixed(1)
const toF = (c) => ((c * 9) / 5 + 32).toFixed(1)
const toMph = (kmh) => (kmh / KM_PER_MILE).toFixed(0)

export default function RouteSummary({ routeData, error }) {
  if (error) {
    return (
      <div className="summary-card summary-card--error">
        <h3 className="summary-error-title">Error</h3>
        <p className="summary-text">{error}</p>
      </div>
    )
  }

  if (!routeData) {
    return (
      <div className="summary-card summary-card--empty">
        <p>Fill in your preferences and click Generate Route to get started.</p>
      </div>
    )
  }

  const { ai_summary, reasoning, conditions, route_geojson } = routeData
  const distance = route_geojson?.features?.[0]?.properties?.summary?.distance
  const duration = route_geojson?.features?.[0]?.properties?.summary?.duration

  const w = conditions?.weather
  const t = conditions?.traffic

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
              <span className="stat-value">{Math.round(duration / 60)} min</span>
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

    </div>
  )
}
