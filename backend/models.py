from pydantic import BaseModel, Field
from typing import Optional


class RouteRequest(BaseModel):
    location: str = Field(..., description="Starting location address")
    skill_level: str = Field(..., description="beginner | intermediate | advanced")
    hills: str = Field(..., description="flat | some_hills | hilly")
    traffic_pref: str = Field(..., description="avoid | moderate | okay")
    distance_km: float = Field(..., ge=1, le=200, description="Target route distance in km")


class WeatherConditions(BaseModel):
    temperature_c: float
    wind_speed_kmh: float
    wind_direction_deg: float
    precipitation_mm: float
    description: str


class TrafficConditions(BaseModel):
    congestion_level: str
    average_speed_kmh: Optional[float] = None
    description: str


class RouteResponse(BaseModel):
    route_geojson: dict
    elevation_profile: list[dict]
    ai_summary: str
    reasoning: str
    conditions: dict
    waypoints: list[list[float]]
    start_coords: list[float]
