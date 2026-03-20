export default function RouteSummary({ routeData, error }) {
  if (error) {
    return (
      <div style={{ ...styles.card, background: '#fff5f5', borderLeft: '4px solid #e63946' }}>
        <h3 style={{ color: '#c53030', marginBottom: 8 }}>Error</h3>
        <p style={styles.text}>{error}</p>
      </div>
    )
  }

  if (!routeData) {
    return (
      <div style={{ ...styles.card, textAlign: 'center', color: '#718096' }}>
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
    <div style={styles.card}>
      <h3 style={styles.heading}>Route Summary</h3>

      <p style={styles.text}>{ai_summary}</p>

      {(distance || duration) && (
        <div style={styles.statsRow}>
          {distance && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>Distance</span>
              <span style={styles.statValue}>{(distance / 1000).toFixed(1)} km</span>
            </div>
          )}
          {duration && (
            <div style={styles.stat}>
              <span style={styles.statLabel}>Est. Time</span>
              <span style={styles.statValue}>{Math.round(duration / 60)} min</span>
            </div>
          )}
        </div>
      )}

      {reasoning && (
        <div style={styles.section}>
          <h4 style={styles.subheading}>AI Reasoning</h4>
          <p style={styles.text}>{reasoning}</p>
        </div>
      )}

      {w && (
        <div style={styles.section}>
          <h4 style={styles.subheading}>Conditions</h4>
          <div style={styles.conditions}>
            <span>Weather: {w.description}</span>
            <span>Temp: {w.temperature_c.toFixed(1)}°C</span>
            <span>Wind: {w.wind_speed_kmh.toFixed(0)} km/h</span>
            {t && <span>Traffic: {t.congestion_level}</span>}
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  heading: {
    fontSize: 17,
    fontWeight: 700,
    color: '#2d6a4f',
  },
  subheading: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4a5568',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: 6,
  },
  text: {
    fontSize: 14,
    lineHeight: 1.6,
    color: '#4a5568',
  },
  statsRow: {
    display: 'flex',
    gap: 16,
  },
  stat: {
    display: 'flex',
    flexDirection: 'column',
    background: '#f0fdf4',
    borderRadius: 8,
    padding: '8px 16px',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#52796f',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2d6a4f',
  },
  section: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: 12,
  },
  conditions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    fontSize: 13,
    color: '#4a5568',
  },
}
