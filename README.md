# Cycling Route Generator

AI-powered cycling route generator using Gemini, real-time weather, and live traffic data.

## Setup

### 1. API Keys

Required:

- `GEMINI_API_KEY` — free at aistudio.google.com
- `ORS_API_KEY` — free at openrouteservice.org

Optional:

- `TOMTOM_API_KEY` — free tier at developer.tomtom.com (traffic data; falls back gracefully without it)

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
fastapi dev main.py --reload-dir .
```

Backend runs at http://localhost:8000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at http://localhost:3000

## Architecture

```
React (localhost:3000)
  └─ POST /api/generate-route
       └─ FastAPI (localhost:8000)
            ├─ Nominatim    → geocode location
            ├─ Open-Meteo   → weather + wind
            ├─ TomTom       → traffic conditions
            ├─ Gemini API   → generate waypoints + reasoning
            └─ OpenRouteService → GeoJSON cycling route
```
