import httpx


async def geocode_location(address: str) -> tuple[float, float]:
    """Geocode an address to (lat, lng) using Nominatim."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": address,
        "format": "json",
        "limit": 1,
    }
    headers = {"User-Agent": "CyclingRouteApp/1.0"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        results = response.json()

    if not results:
        raise ValueError(f"Could not geocode location: {address}")

    lat = float(results[0]["lat"])
    lng = float(results[0]["lon"])
    return lat, lng
