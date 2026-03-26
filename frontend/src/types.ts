import type { FeatureCollection } from "geojson";

export interface WeatherConditions {
  temperature_c: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  precipitation_mm: number;
  uv_index: number;
  humidity_pct: number;
  description: string;
}

export interface TrafficConditions {
  congestion_level: "low" | "moderate" | "high" | "unknown";
  current_speed_kmh?: number;
  free_flow_speed_kmh?: number;
}

export interface RouteConditions {
  weather?: WeatherConditions;
  traffic?: TrafficConditions | null;
}

export interface RouteResponse {
  ai_summary: string;
  reasoning: string;
  route_geojson: FeatureCollection;
  start_coords: [number, number];
  conditions: RouteConditions;
}

export type SkillLevel = "beginner" | "intermediate" | "advanced";
export type Hills = "flat" | "some_hills" | "hilly";
export type TrafficPref = "avoid" | "moderate" | "okay";

export interface RouteFormData {
  location: string;
  skill_level: SkillLevel;
  hills: Hills;
  traffic_pref: TrafficPref;
  distance_km: number;
}

export interface SelectedLocation {
  lat: number;
  lng: number;
  address: string;
}
