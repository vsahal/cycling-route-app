import json
import os
import google.generativeai as genai

WIND_DIRECTIONS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
]


def _deg_to_compass(deg: float) -> str:
    idx = round(deg / 22.5) % 16
    return WIND_DIRECTIONS[idx]


async def generate_waypoints(
    address: str,
    lat: float,
    lng: float,
    skill_level: str,
    hills: str,
    traffic_pref: str,
    distance_km: float,
    weather,
    traffic,
) -> tuple[list[list[float]], str]:
    """
    Ask Gemini to propose cycling route waypoints given user preferences and live data.
    Returns (waypoints, reasoning).
    """
    genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))
    model = genai.GenerativeModel("gemini-2.5-flash")

    wind_dir = _deg_to_compass(weather.wind_direction_deg)

    weather_summary = (
        f"{weather.description}, {weather.temperature_c:.1f}°C, "
        f"wind {weather.wind_speed_kmh:.0f} km/h from {wind_dir}"
    )

    skill_desc = {
        "beginner": "beginner cyclist — prefers gentle terrain, low traffic, shorter climbs",
        "intermediate": "intermediate cyclist — comfortable with moderate hills and some traffic",
        "advanced": "advanced cyclist — can handle steep climbs and busier roads",
    }.get(skill_level, skill_level)

    hills_desc = {
        "flat": "completely flat or nearly flat terrain",
        "some_hills": "gently rolling terrain with moderate elevation changes",
        "hilly": "significant hills and elevation gain",
    }.get(hills, hills)

    traffic_desc = {
        "avoid": "avoid busy roads — prefer dedicated cycle paths and quiet streets",
        "moderate": "accept some traffic but prefer quieter routes where possible",
        "okay": "traffic is acceptable, prioritise directness and interesting routes",
    }.get(traffic_pref, traffic_pref)

    prompt = f"""You are an expert cycling route planner with deep knowledge of roads, cycling infrastructure, and terrain.

Given the following inputs, propose 4–6 waypoints (latitude/longitude) that form a cycling loop starting and ending near the start location.

**Start location:** {address} (lat: {lat:.5f}, lng: {lng:.5f})
**Cyclist skill level:** {skill_desc}
**Terrain preference:** {hills_desc}
**Traffic preference:** {traffic_desc}
**Target distance:** {distance_km:.0f} km round loop
**Current weather:** {weather_summary}
**Traffic conditions near start:** {traffic.description}

Requirements:
- The route must form a loop returning close to the start point
- Waypoints must be real, navigable road/path locations (not in the middle of buildings, water, etc.)
- The total distance between waypoints should approximate {distance_km:.0f} km
- Respect the terrain and traffic preferences
- Consider wind direction when choosing the route (headwind on return is harder)
- If weather is poor (rain, high wind), suggest a more sheltered or shorter option

Respond ONLY with valid JSON in this exact format:
{{
  "waypoints": [[lat1, lng1], [lat2, lng2], [lat3, lng3], ...],
  "reasoning": "Brief explanation of route choices (2-4 sentences)"
}}

The first and last waypoint should be near {lat:.5f}, {lng:.5f}. Do not include markdown code fences."""

    response = await model.generate_content_async(prompt)

    # Extract text from response
    text = response.text

    # Strip any accidental markdown fences
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```")[1]
        if text.startswith("json"):
            text = text[4:]

    data = json.loads(text)
    waypoints = data["waypoints"]
    reasoning = data.get("reasoning", "")

    return waypoints, reasoning
