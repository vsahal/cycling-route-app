# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack cycling route generator that uses Gemini AI to propose loop waypoints based on user preferences, live weather, and traffic data. Routes are then resolved to actual cycling paths via OpenRouteService and displayed on an interactive map.

## Development Commands

### Backend (FastAPI + Python 3.13)

```bash
cd backend
python3 -m venv venv --clear
source venv/bin/activate
venv/bin/pip install -r requirements.txt
venv/bin/fastapi dev main.py --reload-dir .
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev        # dev server on http://localhost:3000
npm run build      # production build
```

The Vite dev server proxies `/api/*` requests to `http://localhost:8000` — ensure the backend is running.

## Environment Variables

Create a `.env` file at the project root (one level above `backend/`). The backend loads it via `load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))`.

Required:
- `GEMINI_API_KEY` — for Gemini waypoint generation (free at aistudio.google.com)
- `ORS_API_KEY` — OpenRouteService for actual cycling route geometry and elevation

Optional:
- `TOMTOM_API_KEY` — traffic congestion data; gracefully falls back to "unknown" if absent

Weather data comes from Open-Meteo (no key required).

## Architecture

**Request flow** (`backend/main.py`):
1. Geocode address → lat/lng via Nominatim (OpenStreetMap)
2. Fetch weather + traffic in parallel (`asyncio.gather`)
3. Ask Gemini (`gemini-2.5-flash`) to generate 4–6 loop waypoints as JSON, given preferences and live conditions
4. Pass waypoints to OpenRouteService to get actual GeoJSON route geometry + elevation profile
5. Return combined response to frontend

**Key design detail:** Gemini only proposes *waypoints* (lat/lng coordinates); the actual road-snapped route geometry comes from OpenRouteService. The prompt explicitly accounts for wind direction (headwind on return), weather severity, and terrain/traffic preferences.

**Frontend** (`frontend/src/`):
- `App.jsx` — top-level layout: sidebar (form + summary) + map area
- `RouteForm.jsx` — collects location, skill level (beginner/intermediate/advanced), terrain (flat/some_hills/hilly), traffic preference (avoid/moderate/okay), distance (5–150 km slider)
- `MapView.jsx` — react-leaflet map, renders GeoJSON route and start point marker, auto-fits bounds; defaults to user geolocation or Austin TX
- `RouteSummary.jsx` — displays AI summary, distance/duration stats, Gemini's reasoning, and weather/traffic conditions

**Backend services** (`backend/services/`):
- `gemini.py` — builds prompt with all context, calls Gemini API async (`generate_content_async`), parses JSON response
- `routing.py` — calls ORS `/v2/directions/cycling-regular/geojson` with `elevation: true`; note ORS expects `[lng, lat]` order (opposite of the app's `[lat, lng]` convention)
- `weather.py` — Open-Meteo forecast API, maps WMO weather codes to descriptions
- `traffic.py` — TomTom Flow Segment Data API; computes congestion ratio (current/free-flow speed)
- `geocoding.py` — Nominatim search

**Models** (`backend/models.py`): Pydantic v2 models for `RouteRequest` and `RouteResponse`.
