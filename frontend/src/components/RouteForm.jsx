import { useState, useEffect, useRef } from 'react'

const SKILL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

const HILLS_OPTIONS = [
  { value: 'flat', label: 'Flat' },
  { value: 'some_hills', label: 'Some Hills' },
  { value: 'hilly', label: 'Hilly' },
]

const TRAFFIC_OPTIONS = [
  { value: 'avoid', label: 'Avoid Traffic' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'okay', label: 'Traffic is Fine' },
]

export default function RouteForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    location: '',
    skill_level: 'intermediate',
    hills: 'some_hills',
    traffic_pref: 'moderate',
    distance_km: 30,
  })
  const [suggestions, setSuggestions] = useState([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debounceRef = useRef(null)

  useEffect(() => {
    const query = form.location.trim()
    if (query.length < 3) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { 'User-Agent': 'CyclingRouteApp/1.0' } }
        )
        const data = await res.json()
        setSuggestions(data.map((r) => r.display_name))
        setShowSuggestions(true)
      } catch {
        setSuggestions([])
      }
    }, 300)
  }, [form.location])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: name === 'distance_km' ? Number(value) : value }))
  }

  const handleSuggestionClick = (suggestion) => {
    setForm((prev) => ({ ...prev, location: suggestion }))
    setSuggestions([])
    setShowSuggestions(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setShowSuggestions(false)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>Cycling Route Generator</h2>

      <div style={styles.field}>
        <label style={styles.label}>Starting Location</label>
        <div style={{ position: 'relative' }}>
          <input
            name="location"
            value={form.location}
            onChange={handleChange}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="e.g. Central Park, New York"
            required
            style={styles.input}
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul style={styles.suggestions}>
              {suggestions.map((s, i) => (
                <li
                  key={i}
                  onMouseDown={() => handleSuggestionClick(s)}
                  style={styles.suggestionItem}
                >
                  {s}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Skill Level</label>
        <div style={styles.radioGroup}>
          {SKILL_OPTIONS.map((o) => (
            <label key={o.value} style={styles.radioLabel}>
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

      <div style={styles.field}>
        <label style={styles.label}>Terrain</label>
        <div style={styles.radioGroup}>
          {HILLS_OPTIONS.map((o) => (
            <label key={o.value} style={styles.radioLabel}>
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

      <div style={styles.field}>
        <label style={styles.label}>Traffic Preference</label>
        <div style={styles.radioGroup}>
          {TRAFFIC_OPTIONS.map((o) => (
            <label key={o.value} style={styles.radioLabel}>
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

      <div style={styles.field}>
        <label style={styles.label}>Distance: {form.distance_km} km</label>
        <input
          type="range"
          name="distance_km"
          min={5}
          max={150}
          step={5}
          value={form.distance_km}
          onChange={handleChange}
          style={styles.slider}
        />
        <div style={styles.sliderLabels}>
          <span>5 km</span>
          <span>150 km</span>
        </div>
      </div>

      <button type="submit" disabled={loading} style={styles.button}>
        {loading ? 'Generating Route...' : 'Generate Route'}
      </button>
    </form>
  )
}

const styles = {
  form: {
    background: '#fff',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    width: 320,
    flexShrink: 0,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#2d6a4f',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
    color: '#4a5568',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  input: {
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  radioGroup: {
    display: 'flex',
    gap: 12,
    flexWrap: 'wrap',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 14,
    cursor: 'pointer',
  },
  slider: {
    width: '100%',
    accentColor: '#2d6a4f',
  },
  sliderLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#718096',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#fff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    marginTop: 4,
    listStyle: 'none',
    padding: 0,
    margin: 0,
    zIndex: 100,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    maxHeight: 200,
    overflowY: 'auto',
  },
  suggestionItem: {
    padding: '8px 12px',
    fontSize: 13,
    cursor: 'pointer',
    color: '#4a5568',
    borderBottom: '1px solid #f0f0f0',
  },
  button: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '12px 0',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
}
