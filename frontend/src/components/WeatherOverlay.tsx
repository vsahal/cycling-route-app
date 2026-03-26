import type { TrafficConditions, WeatherConditions } from "../types.ts";
import "./WeatherOverlay.css";

const KM_PER_MILE = 1.60934;

function uvLabel(uv: number): { label: string; color: string } {
  if (uv <= 2) return { label: "Low", color: "#48bb78" };
  if (uv <= 5) return { label: "Moderate", color: "#ecc94b" };
  if (uv <= 7) return { label: "High", color: "#ed8936" };
  if (uv <= 10) return { label: "Very High", color: "#e53e3e" };
  return { label: "Extreme", color: "#805ad5" };
}

interface Props {
  weather: WeatherConditions | null | undefined;
  traffic: TrafficConditions | null | undefined;
}

export default function WeatherOverlay({ weather, traffic }: Props) {
  if (!weather) return null;

  const tempF = ((weather.temperature_c * 9) / 5 + 32).toFixed(1);
  const windMph = (weather.wind_speed_kmh / KM_PER_MILE).toFixed(0);
  const uv = uvLabel(weather.uv_index);

  // Arrow points in the direction wind is blowing toward (from + 180°)
  const arrowRotation = (weather.wind_direction_deg + 180) % 360;

  return (
    <div className="weather-overlay">
      <div className="weather-title">{weather.description}</div>

      <div className="weather-grid">
        <div className="weather-metric">
          <span className="metric-label">Temp</span>
          <span className="metric-value">{tempF}°F</span>
        </div>

        <div className="weather-metric">
          <span className="metric-label">Humidity</span>
          <span className="metric-value">{weather.humidity_pct}%</span>
        </div>

        <div className="weather-metric">
          <span className="metric-label">Precip</span>
          <span className="metric-value">{weather.precipitation_mm} mm</span>
        </div>

        <div className="weather-metric">
          <span className="metric-label">UV Index</span>
          <span className="metric-value" style={{ color: uv.color }}>
            {weather.uv_index.toFixed(1)} — {uv.label}
          </span>
        </div>

        {traffic && (
          <div className="weather-metric">
            <span className="metric-label">Traffic</span>
            <span
              className={`metric-value traffic-${traffic.congestion_level}`}
            >
              {traffic.congestion_level.charAt(0).toUpperCase() +
                traffic.congestion_level.slice(1)}
            </span>
          </div>
        )}

        <div className="weather-metric weather-metric--full">
          <span className="metric-label">Wind</span>
          <div className="wind-row">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              style={{
                transform: `rotate(${arrowRotation}deg)`,
                flexShrink: 0,
              }}
            >
              <path
                d="M12 2 L12 22 M12 2 L6 10 M12 2 L18 10"
                stroke="#2d6a4f"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
            <span className="metric-value">{windMph} mph</span>
          </div>
        </div>
      </div>
    </div>
  );
}
