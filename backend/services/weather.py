import httpx
from models import WeatherConditions

WIND_DIRECTIONS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
]


def _deg_to_compass(deg: float) -> str:
    idx = round(deg / 22.5) % 16
    return WIND_DIRECTIONS[idx]


async def fetch_weather(lat: float, lng: float) -> WeatherConditions:
    """Fetch current weather and wind from Open-Meteo."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lng,
        "current": [
            "temperature_2m",
            "wind_speed_10m",
            "wind_direction_10m",
            "precipitation",
            "weathercode",
        ],
        "wind_speed_unit": "kmh",
        "forecast_days": 1,
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

    current = data["current"]
    temp = current["temperature_2m"]
    wind_speed = current["wind_speed_10m"]
    wind_dir = current["wind_direction_10m"]
    precip = current["precipitation"]
    wcode = current["weathercode"]

    description = _weather_code_to_description(wcode, precip)

    return WeatherConditions(
        temperature_c=temp,
        wind_speed_kmh=wind_speed,
        wind_direction_deg=wind_dir,
        precipitation_mm=precip,
        description=description,
    )


def _weather_code_to_description(code: int, precip: float) -> str:
    if code == 0:
        return "Clear sky"
    elif code in (1, 2, 3):
        return "Partly cloudy"
    elif code in (45, 48):
        return "Foggy"
    elif code in (51, 53, 55):
        return f"Drizzle ({precip}mm)"
    elif code in (61, 63, 65):
        return f"Rain ({precip}mm)"
    elif code in (71, 73, 75):
        return f"Snow ({precip}mm)"
    elif code in (80, 81, 82):
        return f"Rain showers ({precip}mm)"
    elif code in (95, 96, 99):
        return "Thunderstorm"
    else:
        return f"Weather code {code}"
