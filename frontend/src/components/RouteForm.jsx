import { useState, useEffect, useRef } from "react";
import "./RouteForm.css";

const SKILL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const HILLS_OPTIONS = [
  { value: "flat", label: "Flat" },
  { value: "some_hills", label: "Some Hills" },
  { value: "hilly", label: "Hilly" },
];

const TRAFFIC_OPTIONS = [
  { value: "avoid", label: "Avoid Traffic" },
  { value: "moderate", label: "Moderate" },
  { value: "okay", label: "Traffic is Fine" },
];

export default function RouteForm({ onSubmit, onLocationSelect, loading, selectedLocation }) {
  const [form, setForm] = useState({
    location: "",
    skill_level: "intermediate",
    hills: "some_hills",
    traffic_pref: "moderate",
    distance_miles: 20,
  });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!selectedLocation) return;
    setForm((prev) => ({ ...prev, location: selectedLocation.address }));
    onLocationSelect?.(selectedLocation.lat, selectedLocation.lng);
    setSuggestions([]);
    setShowSuggestions(false);
  }, [selectedLocation]);

  useEffect(() => {
    const query = form.location.trim();
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { "User-Agent": "CyclingRouteApp/1.0" } },
        );
        const data = await res.json();
        setSuggestions(
          data.map((r) => ({
            name: r.display_name,
            lat: parseFloat(r.lat),
            lng: parseFloat(r.lon),
          })),
        );
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [form.location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "distance_miles" ? Number(value) : value,
    }));
  };

  const handleSuggestionClick = (suggestion) => {
    setForm((prev) => ({ ...prev, location: suggestion.name }));
    setSuggestions([]);
    setShowSuggestions(false);
    onLocationSelect?.(suggestion.lat, suggestion.lng);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    const { distance_miles, ...rest } = form;
    onSubmit({ ...rest, distance_km: Math.round(distance_miles * 1.60934) });
  };

  return (
    <form onSubmit={handleSubmit} className="route-form">
      {loading && (
        <div className="form-overlay">
          <div className="spinner" />
          <span className="spinner-text">Generating route…</span>
        </div>
      )}
      <h2 className="route-form-title">Cycling Route Generator</h2>

      <div className="form-field">
        <label className="form-label">Starting Location</label>
        <div className="location-wrapper">
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="e.g. Central Park, New York"
            required
            className="form-input"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-list">
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={() => handleSuggestionClick(s)}
                  className="suggestion-item"
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Skill Level</label>
        <div className="radio-group">
          {SKILL_OPTIONS.map((o) => (
            <label key={o.value} className="radio-label">
              <input
                type="radio"
                name="skill_level"
                value={o.value}
                checked={form.skill_level === o.value}
                onChange={handleChange}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Terrain</label>
        <div className="radio-group">
          {HILLS_OPTIONS.map((o) => (
            <label key={o.value} className="radio-label">
              <input
                type="radio"
                name="hills"
                value={o.value}
                checked={form.hills === o.value}
                onChange={handleChange}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Traffic Preference</label>
        <div className="radio-group">
          {TRAFFIC_OPTIONS.map((o) => (
            <label key={o.value} className="radio-label">
              <input
                type="radio"
                name="traffic_pref"
                value={o.value}
                checked={form.traffic_pref === o.value}
                onChange={handleChange}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>

      <div className="form-field">
        <label className="form-label">Distance: {form.distance_miles} mi</label>
        <input
          type="range"
          name="distance_miles"
          min={5}
          max={100}
          step={5}
          value={form.distance_miles}
          onChange={handleChange}
          className="form-slider"
        />
        <div className="slider-labels">
          <span>5 mi</span>
          <span>100 mi</span>
        </div>
      </div>

      <button type="submit" disabled={loading} className="submit-button">
        {loading ? "Generating Route..." : "Generate Route"}
      </button>
    </form>
  );
}
