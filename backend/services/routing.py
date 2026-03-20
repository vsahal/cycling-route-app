import httpx
import os


async def get_cycling_route(waypoints: list[list[float]]) -> tuple[dict, list[dict]]:
    """
    Get a cycling route GeoJSON and elevation profile from OpenRouteService.
    waypoints: list of [lat, lng] pairs
    Returns: (geojson_feature_collection, elevation_profile)
    """
    api_key = os.environ.get("ORS_API_KEY")
    if not api_key:
        raise ValueError("ORS_API_KEY not configured")

    # ORS expects [lng, lat] order
    coordinates = [[lng, lat] for lat, lng in waypoints]

    url = "https://api.openrouteservice.org/v2/directions/cycling-regular/geojson"
    headers = {
        "Authorization": api_key,
        "Content-Type": "application/json",
    }
    body = {
        "coordinates": coordinates,
        "elevation": True,
        "instructions": False,
        "preference": "recommended",
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=body, headers=headers, timeout=30)
        response.raise_for_status()
        data = response.json()

    # Extract elevation profile from geometry coordinates [lng, lat, elevation]
    feature = data["features"][0]
    coords = feature["geometry"]["coordinates"]
    elevation_profile = [
        {"distance_m": i * (feature["properties"]["summary"]["distance"] / max(len(coords) - 1, 1)),
         "elevation_m": c[2] if len(c) > 2 else 0}
        for i, c in enumerate(coords)
    ]

    return data, elevation_profile
