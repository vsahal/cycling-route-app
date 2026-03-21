import json
import os
import google.generativeai as genai

KM_PER_MILE = 1.60934

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
    temp_f = weather.temperature_c * 9 / 5 + 32
    wind_mph = weather.wind_speed_kmh / KM_PER_MILE

    weather_summary = (
        f"{weather.description}, {temp_f:.1f}°F, "
        f"wind {wind_mph:.0f} mph from {wind_dir}"
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
**Target distance:** {distance_km / KM_PER_MILE:.0f} miles round loop
**Current weather:** {weather_summary}
**Traffic conditions near start:** {traffic.description}

Requirements:
- The route MUST form a loop — the last waypoint should return close to the start point
- Waypoints must lie on real roads, bike lanes, cycling paths, or shared-use paths — never cut through private land, buildings, or water
- Prioritise dedicated cycling infrastructure (bike paths, greenways, rail trails) over roads wherever available
- When cycling infrastructure is unavailable, use legal roads with low traffic or wide shoulders
- Space waypoints so the routing engine can connect them via actual roads/paths — avoid placing waypoints that would require off-road shortcuts
- The total distance between waypoints should approximate {distance_km / KM_PER_MILE:.0f} miles
- Use miles in your reasoning, not kilometers
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
