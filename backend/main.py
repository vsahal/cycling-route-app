import asyncio
import os
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import RouteRequest, RouteResponse
from services.geocoding import geocode_location
from services.weather import fetch_weather
from services.traffic import fetch_traffic
from services.gemini import generate_waypoints
from services.routing import get_cycling_route

app = FastAPI(title="Cycling Route Generator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/api/generate-route", response_model=RouteResponse)
async def generate_route(request: RouteRequest):
    # 1. Geocode the location
    try:
        lat, lng = await geocode_location(request.location)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # 2. Fetch weather and traffic in parallel
    weather, traffic = await asyncio.gather(
        fetch_weather(lat, lng),
        fetch_traffic(lat, lng),
    )

    # 3. Ask Gemini to generate waypoints
    try:
        waypoints, reasoning = await generate_waypoints(
            address=request.location,
            lat=lat,
            lng=lng,
            skill_level=request.skill_level,
            hills=request.hills,
            traffic_pref=request.traffic_pref,
            distance_km=request.distance_km,
            weather=weather,
            traffic=traffic,
        )
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Gemini API error: {str(e)}"
        )

    # 4. Get actual cycling route from OpenRouteService
    try:
        route_geojson, elevation_profile = await get_cycling_route(waypoints)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Routing API error: {str(e)}"
        )

    # 5. Build AI summary
    summary_parts = [
        f"A {request.distance_km:.0f} km cycling loop from {request.location}.",
        f"Conditions: {weather.description}, {weather.temperature_c:.1f}°C, "
        f"wind {weather.wind_speed_kmh:.0f} km/h.",
        f"Traffic: {traffic.congestion_level}.",
    ]
    ai_summary = " ".join(summary_parts)

    return RouteResponse(
        route_geojson=route_geojson,
        elevation_profile=elevation_profile,
        ai_summary=ai_summary,
        reasoning=reasoning,
        conditions={
            "weather": weather.model_dump(),
            "traffic": traffic.model_dump(),
        },
        waypoints=waypoints,
        start_coords=[lat, lng],
    )
