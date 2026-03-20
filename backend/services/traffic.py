import httpx
import os
from models import TrafficConditions


async def fetch_traffic(lat: float, lng: float) -> TrafficConditions:
    """Fetch traffic flow near a point using TomTom Traffic Flow API."""
    api_key = os.environ.get("TOMTOM_API_KEY")
    if not api_key:
        return TrafficConditions(
            congestion_level="unknown",
            description="Traffic data unavailable (no API key configured)",
        )

    # TomTom flow segment data — point-based query
    url = (
        f"https://api.tomtom.com/traffic/services/4/flowSegmentData/relative0/10/json"
    )
    params = {
        "point": f"{lat},{lng}",
        "key": api_key,
        "unit": "KMPH",
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()

        segment = data.get("flowSegmentData", {})
        current_speed = segment.get("currentSpeed", 0)
        free_flow_speed = segment.get("freeFlowSpeed", 1)
        confidence = segment.get("confidence", 0)

        ratio = current_speed / free_flow_speed if free_flow_speed > 0 else 1.0

        if ratio >= 0.8:
            level = "light"
        elif ratio >= 0.5:
            level = "moderate"
        else:
            level = "heavy"

        description = (
            f"{level.capitalize()} traffic near start. "
            f"Current speed ~{current_speed} km/h "
            f"(free-flow: {free_flow_speed} km/h, confidence: {confidence:.0%})"
        )

        return TrafficConditions(
            congestion_level=level,
            average_speed_kmh=current_speed,
            description=description,
        )

    except Exception as e:
        return TrafficConditions(
            congestion_level="unknown",
            description=f"Traffic data unavailable: {str(e)}",
        )
